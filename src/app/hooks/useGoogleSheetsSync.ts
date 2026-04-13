import { useEffect, useState } from 'react';
import { getDataSnapshot, setDataSnapshot } from '../data/store';
import {
  fetchDashboardDataWithHealthFromGoogleSheets,
  type GoogleSheetsSyncHealth,
  isGoogleSheetsConfigured,
} from '../utils/googleSheets';
import { isSupabaseConfigured } from '../../lib/supabase';

const DEFAULT_SYNC_INTERVAL_MS = 30000;

interface EntityDelta {
  added: number;
  updated: number;
  removed: number;
}

interface SyncDeltaSummary {
  at: string;
  goals: EntityDelta;
  offices: EntityDelta;
  users: EntityDelta;
  kpis: EntityDelta;
  monthlyAccomplishments: EntityDelta;
  issues: EntityDelta;
  movs: EntityDelta;
  recentKpis: string[];
}

function computeEntityDelta<T extends { id: string }>(prev: T[] = [], next: T[] = []): EntityDelta {
  const prevMap = new Map(prev.map((item) => [item.id, item]));
  const nextMap = new Map(next.map((item) => [item.id, item]));

  let added = 0;
  let updated = 0;

  nextMap.forEach((nextItem, id) => {
    const prevItem = prevMap.get(id);
    if (!prevItem) {
      added += 1;
      return;
    }
    if (JSON.stringify(prevItem) !== JSON.stringify(nextItem)) {
      updated += 1;
    }
  });

  let removed = 0;
  prevMap.forEach((_, id) => {
    if (!nextMap.has(id)) removed += 1;
  });

  return { added, updated, removed };
}

export function useGoogleSheetsSync() {
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
  const [lastAttemptAt, setLastAttemptAt] = useState<Date | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [syncHealth, setSyncHealth] = useState<GoogleSheetsSyncHealth | null>(null);
  const [lastDelta, setLastDelta] = useState<SyncDeltaSummary | null>(null);
  const allowWithSupabase = String((import.meta as any).env?.VITE_GOOGLE_SHEETS_WITH_SUPABASE || '')
    .trim()
    .toLowerCase() === 'true';
  const primaryDataSource = String((import.meta as any).env?.VITE_PRIMARY_DATA_SOURCE || '')
    .trim()
    .toLowerCase();
  const googleIsPrimary = primaryDataSource === 'google_sheets';
  const shouldSyncGoogleSheets =
    isGoogleSheetsConfigured && (googleIsPrimary || !isSupabaseConfigured || allowWithSupabase);
  const intervalMs = Number(((import.meta as any).env?.VITE_GOOGLE_SHEETS_SYNC_INTERVAL_MS) || DEFAULT_SYNC_INTERVAL_MS);

  useEffect(() => {
    if (!shouldSyncGoogleSheets) return;

    let cancelled = false;

    const sync = async () => {
      const startedAt = new Date();
      setLastAttemptAt(startedAt);
      setIsSyncing(true);
      try {
        const previousData = getDataSnapshot();
        const result = await fetchDashboardDataWithHealthFromGoogleSheets();
        const nextData = result.data;
        if (!cancelled) {
          setDataSnapshot(nextData);
          const syncedAt = new Date();
          setLastSyncedAt(syncedAt);
          setSyncHealth(result.health);

          const nextKpis = nextData.kpis || [];
          const prevKpis = previousData.kpis || [];
          const prevKpiMap = new Map(prevKpis.map((kpi) => [kpi.id, kpi]));
          const recentKpis = nextKpis
            .filter((kpi) => {
              const previous = prevKpiMap.get(kpi.id);
              return !previous || JSON.stringify(previous) !== JSON.stringify(kpi);
            })
            .slice(0, 8)
            .map((kpi) => `${kpi.code} - ${kpi.name}`);

          setLastDelta({
            at: syncedAt.toISOString(),
            goals: computeEntityDelta(previousData.goals, nextData.goals || previousData.goals),
            offices: computeEntityDelta(previousData.offices, nextData.offices || previousData.offices),
            users: computeEntityDelta(previousData.users, nextData.users || previousData.users),
            kpis: computeEntityDelta(previousData.kpis, nextData.kpis || previousData.kpis),
            monthlyAccomplishments: computeEntityDelta(
              previousData.monthlyAccomplishments,
              nextData.monthlyAccomplishments || previousData.monthlyAccomplishments,
            ),
            issues: computeEntityDelta(previousData.issues, nextData.issues || previousData.issues),
            movs: computeEntityDelta(previousData.movs, nextData.movs || previousData.movs),
            recentKpis,
          });

          setSyncError(null);
        }
      } catch (error) {
        if (!cancelled) {
          setSyncError(error instanceof Error ? error.message : 'Google Sheets sync failed.');
        }
      } finally {
        if (!cancelled) setIsSyncing(false);
      }
    };

    sync();
    const timer = window.setInterval(sync, intervalMs);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, []);

  return {
    isGoogleSheetsConfigured: shouldSyncGoogleSheets,
    googleIsPrimary,
    isSyncing,
    intervalMs,
    lastAttemptAt,
    lastSyncedAt,
    syncError,
    syncHealth,
    lastDelta,
  };
}
