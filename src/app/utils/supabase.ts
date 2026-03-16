/**
 * Supabase data layer — sync, insert, and mutation helpers.
 *
 * Flow:
 *   Google Sheet → Google Apps Script → Supabase Edge Function (sheets-sync)
 *     → Supabase tables → syncFromSupabase() → store.ts → dashboards
 */

import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { replaceDataSnapshot, setDataSnapshot, getDataSnapshot } from '../data/store';
import type { Goal, Issue, KPI, MonthlyAccomplishment, MOV, Office } from '../types';

// ─────────────────────────── Raw Supabase row types ───────────────────────────

interface OfficeRow {
  id: string;
  name: string;
  code: string;
  focal_person: string;
}

interface GoalRow {
  id: string;
  number: number;
  name: string;
  description: string;
}

interface KPIRow {
  id: string;
  code: string;
  name: string;
  description: string;
  goal_id: string;
  office_id: string;
  target: number;
  unit: string;
  status: string;
  submission_status: string;
  submission_date: string | null;
  focal_person: string;
}

interface MonthlyRow {
  id: string;
  kpi_id: string;
  month: string;
  accomplishment: number;
  percentage: number;
  remarks: string | null;
}

interface IssueRow {
  id: string;
  kpi_id: string;
  office_id: string;
  category: string;
  description: string;
  severity: string;
  status: string;
  assistance_needed: string | null;
  date_reported: string;
}

interface MOVRow {
  id: string;
  kpi_id: string;
  month: string;
  file_name: string;
  file_url: string;
  uploaded_by: string;
  uploaded_date: string;
  validated: boolean;
  validator_notes: string | null;
}

// ─────────────────────────── Row → domain mappers ─────────────────────────────

function mapOffice(r: OfficeRow): Office {
  return {
    id: r.id,
    name: r.name,
    code: r.code,
    focalPerson: r.focal_person,
  };
}

function mapGoal(r: GoalRow): Goal {
  return {
    id: r.id,
    number: r.number,
    name: r.name,
    description: r.description ?? '',
  };
}

function mapKPI(r: KPIRow): KPI {
  return {
    id: r.id,
    code: r.code,
    name: r.name,
    description: r.description ?? '',
    goalId: r.goal_id,
    officeId: r.office_id,
    target: r.target,
    unit: r.unit,
    status: r.status as KPI['status'],
    submissionStatus: r.submission_status as KPI['submissionStatus'],
    submissionDate: r.submission_date ?? undefined,
    focalPerson: r.focal_person,
  };
}

function mapMonthly(r: MonthlyRow): MonthlyAccomplishment {
  return {
    id: r.id,
    kpiId: r.kpi_id,
    month: r.month as MonthlyAccomplishment['month'],
    accomplishment: r.accomplishment,
    percentage: r.percentage,
    remarks: r.remarks ?? undefined,
  };
}

function mapIssue(r: IssueRow): Issue {
  return {
    id: r.id,
    kpiId: r.kpi_id,
    officeId: r.office_id,
    category: r.category,
    description: r.description,
    severity: r.severity as Issue['severity'],
    status: r.status as Issue['status'],
    assistanceNeeded: r.assistance_needed ?? undefined,
    dateReported: r.date_reported,
  };
}

function mapMOV(r: MOVRow): MOV {
  return {
    id: r.id,
    kpiId: r.kpi_id,
    month: r.month,
    fileName: r.file_name,
    fileUrl: r.file_url,
    uploadedBy: r.uploaded_by,
    uploadedDate: r.uploaded_date,
    validated: r.validated,
    validatorNotes: r.validator_notes ?? undefined,
  };
}

// ──────────────────────────── syncFromSupabase ────────────────────────────────

/**
 * Fetches all tables from Supabase in parallel and replaces the store.
 * Falls back silently to existing store data when Supabase is not configured.
 */
export async function syncFromSupabase(): Promise<void> {
  if (!isSupabaseConfigured) return;

  const [
    { data: officesData, error: officesErr },
    { data: goalsData, error: goalsErr },
    { data: kpisData, error: kpisErr },
    { data: monthlyData, error: monthlyErr },
    { data: issuesData, error: issuesErr },
    { data: movsData, error: movsErr },
  ] = await Promise.all([
    supabase.from('offices').select('*').order('name'),
    supabase.from('goals').select('*').order('number'),
    supabase.from('kpis').select('*').order('code'),
    supabase.from('monthly_accomplishments').select('*').order('kpi_id'),
    supabase.from('issues').select('*').order('date_reported', { ascending: false }),
    supabase.from('movs').select('*').order('uploaded_date', { ascending: false }),
  ]);

  const errors = [officesErr, goalsErr, kpisErr, monthlyErr, issuesErr, movsErr].filter(Boolean);
  if (errors.length) {
    console.error('[syncFromSupabase] Supabase query errors:', errors);
    // Don't wipe existing store on partial failure
    return;
  }

  const current = getDataSnapshot();

  replaceDataSnapshot({
    goals: goalsData ? (goalsData as GoalRow[]).map(mapGoal) : current.goals,
    offices: officesData ? (officesData as OfficeRow[]).map(mapOffice) : current.offices,
    users: current.users, // profiles are auth-managed; keep existing
    kpis: kpisData ? (kpisData as KPIRow[]).map(mapKPI) : current.kpis,
    monthlyAccomplishments: monthlyData
      ? (monthlyData as MonthlyRow[]).map(mapMonthly)
      : current.monthlyAccomplishments,
    issues: issuesData ? (issuesData as IssueRow[]).map(mapIssue) : current.issues,
    movs: movsData ? (movsData as MOVRow[]).map(mapMOV) : current.movs,
  });
}

// ─────────────────────────────── insertKPIs ───────────────────────────────────

/**
 * Upserts an array of KPI records into Supabase.
 * Uses the KPI `id` as the conflict target so re-runs are idempotent.
 */
export async function insertKPIs(data: KPI[]): Promise<void> {
  if (!isSupabaseConfigured) return;

  const rows = data.map((k) => ({
    id: k.id,
    code: k.code,
    name: k.name,
    description: k.description,
    goal_id: k.goalId,
    office_id: k.officeId,
    target: k.target,
    unit: k.unit,
    status: k.status,
    submission_status: k.submissionStatus,
    submission_date: k.submissionDate ?? null,
    focal_person: k.focalPerson,
  }));

  const { error } = await supabase.from('kpis').upsert(rows, { onConflict: 'id' });
  if (error) throw new Error(`insertKPIs failed: ${error.message}`);

  // Refresh store
  const { data: kpisData } = await supabase.from('kpis').select('*').order('code');
  if (kpisData) {
    setDataSnapshot({ kpis: (kpisData as KPIRow[]).map(mapKPI) });
  }
}

// ────────────────────────── insertMonthlyAccomplishments ──────────────────────

/**
 * Upserts monthly accomplishment records.
 * Conflict target is the unique (kpi_id, month) pair.
 */
export async function insertMonthlyAccomplishments(
  data: MonthlyAccomplishment[],
): Promise<void> {
  if (!isSupabaseConfigured) return;

  const rows = data.map((m) => ({
    id: m.id,
    kpi_id: m.kpiId,
    month: m.month,
    accomplishment: m.accomplishment,
    percentage: m.percentage,
    remarks: m.remarks ?? null,
  }));

  const { error } = await supabase
    .from('monthly_accomplishments')
    .upsert(rows, { onConflict: 'kpi_id,month' });
  if (error) throw new Error(`insertMonthlyAccomplishments failed: ${error.message}`);

  const { data: monthlyData } = await supabase
    .from('monthly_accomplishments')
    .select('*')
    .order('kpi_id');
  if (monthlyData) {
    setDataSnapshot({
      monthlyAccomplishments: (monthlyData as MonthlyRow[]).map(mapMonthly),
    });
  }
}

// ───────────────────────────── uploadMOV ──────────────────────────────────────

export interface MOVUploadMetadata {
  id: string;
  kpiId: string;
  month: string;
  uploadedBy: string;
  validatorNotes?: string;
}

/**
 * Uploads a file to Supabase Storage (bucket: "movs") then inserts metadata
 * into the movs table. Returns the inserted MOV domain object.
 */
export async function uploadMOV(file: File, meta: MOVUploadMetadata): Promise<MOV> {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase is not configured.');
  }

  const storagePath = `${meta.kpiId}/${meta.month}/${file.name}`;

  const { error: storageError } = await supabase.storage
    .from('movs')
    .upload(storagePath, file, { upsert: true });

  if (storageError) throw new Error(`MOV file upload failed: ${storageError.message}`);

  const { data: urlData } = supabase.storage.from('movs').getPublicUrl(storagePath);
  const fileUrl = urlData.publicUrl;

  const row: Omit<MOVRow, 'validated'> & { validated: boolean } = {
    id: meta.id,
    kpi_id: meta.kpiId,
    month: meta.month,
    file_name: file.name,
    file_url: fileUrl,
    uploaded_by: meta.uploadedBy,
    uploaded_date: new Date().toISOString().slice(0, 10),
    validated: false,
    validator_notes: meta.validatorNotes ?? null,
  };

  const { data: inserted, error: insertError } = await supabase
    .from('movs')
    .upsert(row, { onConflict: 'id' })
    .select()
    .single();

  if (insertError) throw new Error(`MOV metadata insert failed: ${insertError.message}`);

  const mov = mapMOV(inserted as MOVRow);

  // Update store to include the new MOV
  const current = getDataSnapshot();
  const updatedMovs = [
    ...current.movs.filter((m) => m.id !== mov.id),
    mov,
  ];
  setDataSnapshot({ movs: updatedMovs });

  return mov;
}

// ───────────────────────────── updateKPIStatus ────────────────────────────────

/**
 * Updates the status and/or submissionStatus of a single KPI.
 */
export async function updateKPIStatus(
  kpiId: string,
  updates: Partial<Pick<KPI, 'status' | 'submissionStatus' | 'submissionDate'>>,
): Promise<void> {
  if (!isSupabaseConfigured) return;

  const dbUpdates: Record<string, unknown> = {};
  if (updates.status !== undefined) dbUpdates.status = updates.status;
  if (updates.submissionStatus !== undefined)
    dbUpdates.submission_status = updates.submissionStatus;
  if (updates.submissionDate !== undefined)
    dbUpdates.submission_date = updates.submissionDate ?? null;

  const { data: updated, error } = await supabase
    .from('kpis')
    .update(dbUpdates)
    .eq('id', kpiId)
    .select()
    .single();

  if (error) throw new Error(`updateKPIStatus failed: ${error.message}`);

  const current = getDataSnapshot();
  setDataSnapshot({
    kpis: current.kpis.map((k) => (k.id === kpiId ? mapKPI(updated as KPIRow) : k)),
  });
}

// ────────────────────────────── addIssue ──────────────────────────────────────

/**
 * Inserts a new Issue record into Supabase and appends it to the store.
 */
export async function addIssue(issueData: Issue): Promise<Issue> {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase is not configured.');
  }

  const row: IssueRow = {
    id: issueData.id,
    kpi_id: issueData.kpiId,
    office_id: issueData.officeId,
    category: issueData.category,
    description: issueData.description,
    severity: issueData.severity,
    status: issueData.status,
    assistance_needed: issueData.assistanceNeeded ?? null,
    date_reported: issueData.dateReported,
  };

  const { data: inserted, error } = await supabase
    .from('issues')
    .insert(row)
    .select()
    .single();

  if (error) throw new Error(`addIssue failed: ${error.message}`);

  const issue = mapIssue(inserted as IssueRow);
  const current = getDataSnapshot();
  setDataSnapshot({ issues: [issue, ...current.issues] });
  return issue;
}

// ─────────────────────────── updateMOVValidation ──────────────────────────────

/**
 * Marks a MOV as validated (or not) and saves optional validator notes.
 */
export async function updateMOVValidation(
  movId: string,
  validated: boolean,
  notes?: string,
): Promise<void> {
  if (!isSupabaseConfigured) return;

  const { data: updated, error } = await supabase
    .from('movs')
    .update({ validated, validator_notes: notes ?? null })
    .eq('id', movId)
    .select()
    .single();

  if (error) throw new Error(`updateMOVValidation failed: ${error.message}`);

  const current = getDataSnapshot();
  setDataSnapshot({
    movs: current.movs.map((m) =>
      m.id === movId ? mapMOV(updated as MOVRow) : m,
    ),
  });
}
