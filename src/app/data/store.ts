import { useSyncExternalStore } from 'react';
import {
  goals as mockGoals,
  offices as mockOffices,
  users as mockUsers,
  kpis as mockKpis,
  monthlyAccomplishments as mockMonthlyAccomplishments,
  issues as mockIssues,
  movs as mockMovs,
} from './mockData';
import { isSupabaseConfigured } from '../../lib/supabase';
import type { Goal, Issue, KPI, MonthlyAccomplishment, MOV, Office, User } from '../types';

export interface AppDataSnapshot {
  goals: Goal[];
  offices: Office[];
  users: User[];
  kpis: KPI[];
  monthlyAccomplishments: MonthlyAccomplishment[];
  issues: Issue[];
  movs: MOV[];
}

/**
 * When Supabase is configured the store starts empty so that only real data
 * is displayed once syncFromSupabase() completes.
 * When Supabase is NOT configured, mock data is used as the default so the
 * dashboards are still usable in development / demo mode.
 */
const initialData: AppDataSnapshot = isSupabaseConfigured
  ? {
      goals: [],
      offices: [],
      users: [],
      kpis: [],
      monthlyAccomplishments: [],
      issues: [],
      movs: [],
    }
  : {
      goals: mockGoals,
      offices: mockOffices,
      users: mockUsers,
      kpis: mockKpis,
      monthlyAccomplishments: mockMonthlyAccomplishments,
      issues: mockIssues,
      movs: mockMovs,
    };

let currentData: AppDataSnapshot = initialData;

const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((listener) => listener());
}

export function getDataSnapshot(): AppDataSnapshot {
  return currentData;
}

export function subscribeData(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function setDataSnapshot(partial: Partial<AppDataSnapshot>) {
  currentData = {
    ...currentData,
    ...partial,
  };
  notify();
}

export function replaceDataSnapshot(next: AppDataSnapshot) {
  currentData = next;
  notify();
}

export function useAppData() {
  return useSyncExternalStore(subscribeData, getDataSnapshot, getDataSnapshot);
}
