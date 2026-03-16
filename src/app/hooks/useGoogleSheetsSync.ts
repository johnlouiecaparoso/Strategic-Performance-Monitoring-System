import { useEffect, useState } from 'react';
import { setDataSnapshot } from '../data/store';
import {
  fetchDashboardDataFromGoogleSheets,
  isGoogleSheetsConfigured,
} from '../utils/googleSheets';

const DEFAULT_SYNC_INTERVAL_MS = 30000;

export function useGoogleSheetsSync() {
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);

  useEffect(() => {
    if (!isGoogleSheetsConfigured) return;

    let cancelled = false;
    const intervalMs = Number(((import.meta as any).env?.VITE_GOOGLE_SHEETS_SYNC_INTERVAL_MS) || DEFAULT_SYNC_INTERVAL_MS);

    const sync = async () => {
      setIsSyncing(true);
      try {
        const nextData = await fetchDashboardDataFromGoogleSheets();
        if (!cancelled) {
          setDataSnapshot(nextData);
          setLastSyncedAt(new Date());
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
    isGoogleSheetsConfigured,
    isSyncing,
    lastSyncedAt,
    syncError,
  };
}
