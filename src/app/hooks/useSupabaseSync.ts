/**
 * useSupabaseSync — startup data sync + optional Realtime subscriptions.
 *
 * On mount (once per session):
 *   1. Calls syncFromSupabase() to hydrate the store with live Supabase data.
 *   2. Opens Realtime subscriptions for kpis, monthly_accomplishments,
 *      issues, and movs so the store stays up-to-date without page refreshes.
 *
 * When Supabase is not configured the hook is a no-op and mock data is kept.
 */

import { useEffect, useRef, useState } from 'react';
import { isSupabaseConfigured, supabase } from '../../lib/supabase';
import { setDataSnapshot, getDataSnapshot } from '../data/store';
import {
  syncFromSupabase,
  // Individual mappers are internal, so we re-fetch affected slices on RT events
} from '../utils/supabase';
import type { KPI, MonthlyAccomplishment, Issue, MOV } from '../types';

// ── Minimal row types needed for Realtime payloads ──────────────────────────

interface RTKPIRow {
  id: string; code: string; name: string; description: string;
  goal_id: string; office_id: string; target: number; unit: string;
  status: string; submission_status: string; submission_date: string | null;
  focal_person: string;
}

interface RTMonthlyRow {
  id: string; kpi_id: string; month: string;
  accomplishment: number; percentage: number; remarks: string | null;
}

interface RTIssueRow {
  id: string; kpi_id: string; office_id: string; category: string;
  description: string; severity: string; status: string;
  assistance_needed: string | null; date_reported: string;
}

interface RTMOVRow {
  id: string; kpi_id: string; month: string; file_name: string;
  file_url: string; uploaded_by: string; uploaded_date: string;
  validated: boolean; validator_notes: string | null;
}

// ── Row mappers (duplicated from utils/supabase.ts to avoid circular dep) ────

function rtMapKPI(r: RTKPIRow): KPI {
  return {
    id: r.id, code: r.code, name: r.name, description: r.description ?? '',
    goalId: r.goal_id, officeId: r.office_id, target: r.target, unit: r.unit,
    status: r.status as KPI['status'],
    submissionStatus: r.submission_status as KPI['submissionStatus'],
    submissionDate: r.submission_date ?? undefined,
    focalPerson: r.focal_person,
  };
}

function rtMapMonthly(r: RTMonthlyRow): MonthlyAccomplishment {
  return {
    id: r.id, kpiId: r.kpi_id,
    month: r.month as MonthlyAccomplishment['month'],
    accomplishment: r.accomplishment, percentage: r.percentage,
    remarks: r.remarks ?? undefined,
  };
}

function rtMapIssue(r: RTIssueRow): Issue {
  return {
    id: r.id, kpiId: r.kpi_id, officeId: r.office_id,
    category: r.category, description: r.description,
    severity: r.severity as Issue['severity'],
    status: r.status as Issue['status'],
    assistanceNeeded: r.assistance_needed ?? undefined,
    dateReported: r.date_reported,
  };
}

function rtMapMOV(r: RTMOVRow): MOV {
  return {
    id: r.id, kpiId: r.kpi_id, month: r.month,
    fileName: r.file_name, fileUrl: r.file_url,
    uploadedBy: r.uploaded_by, uploadedDate: r.uploaded_date,
    validated: r.validated,
    validatorNotes: r.validator_notes ?? undefined,
  };
}

// ── Generic list-patch helper ────────────────────────────────────────────────

type EventType = 'INSERT' | 'UPDATE' | 'DELETE';

function patchList<T extends { id: string }>(
  list: T[],
  event: EventType,
  record: T,
): T[] {
  switch (event) {
    case 'INSERT':
      return list.some((item) => item.id === record.id) ? list : [record, ...list];
    case 'UPDATE':
      return list.map((item) => (item.id === record.id ? record : item));
    case 'DELETE':
      return list.filter((item) => item.id !== record.id);
    default:
      return list;
  }
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useSupabaseSync() {
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const didSync = useRef(false);

  // ── Initial full sync ────────────────────────────────────────────────────
  useEffect(() => {
    if (!isSupabaseConfigured || didSync.current) return;
    didSync.current = true;

    let cancelled = false;

    (async () => {
      setIsSyncing(true);
      try {
        await syncFromSupabase();
        if (!cancelled) {
          setLastSyncedAt(new Date());
          setSyncError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setSyncError(err instanceof Error ? err.message : 'Supabase sync failed.');
          console.error('[useSupabaseSync] Sync error:', err);
        }
      } finally {
        if (!cancelled) setIsSyncing(false);
      }
    })();

    return () => { cancelled = true; };
  }, []);

  // ── Realtime subscriptions ──────────────────────────────────────────────
  useEffect(() => {
    if (!isSupabaseConfigured) return;

    const channel = supabase
      .channel('spms-realtime')

      // KPIs
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'kpis' },
        ({ eventType, new: newRow, old: oldRow }) => {
          const current = getDataSnapshot();
          const record = rtMapKPI((eventType === 'DELETE' ? oldRow : newRow) as RTKPIRow);
          setDataSnapshot({ kpis: patchList(current.kpis, eventType as EventType, record) });
        },
      )

      // Monthly accomplishments
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'monthly_accomplishments' },
        ({ eventType, new: newRow, old: oldRow }) => {
          const current = getDataSnapshot();
          const record = rtMapMonthly((eventType === 'DELETE' ? oldRow : newRow) as RTMonthlyRow);
          setDataSnapshot({
            monthlyAccomplishments: patchList(
              current.monthlyAccomplishments,
              eventType as EventType,
              record,
            ),
          });
        },
      )

      // Issues
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'issues' },
        ({ eventType, new: newRow, old: oldRow }) => {
          const current = getDataSnapshot();
          const record = rtMapIssue((eventType === 'DELETE' ? oldRow : newRow) as RTIssueRow);
          setDataSnapshot({ issues: patchList(current.issues, eventType as EventType, record) });
        },
      )

      // MOVs
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'movs' },
        ({ eventType, new: newRow, old: oldRow }) => {
          const current = getDataSnapshot();
          const record = rtMapMOV((eventType === 'DELETE' ? oldRow : newRow) as RTMOVRow);
          setDataSnapshot({ movs: patchList(current.movs, eventType as EventType, record) });
        },
      )

      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { isSupabaseConfigured, isSyncing, lastSyncedAt, syncError };
}
