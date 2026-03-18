import type { Goal, Issue, KPI, MonthlyAccomplishment, MOV, Office, User } from '../types';
import type { AppDataSnapshot } from '../data/store';

export interface SheetData {
  range: string;
  values: string[][];
}

const GOOGLE_SHEETS_API_KEY = (import.meta.env.VITE_GOOGLE_SHEETS_API_KEY || '') as string;
const GOOGLE_SHEETS_SPREADSHEET_ID = (import.meta.env.VITE_GOOGLE_SHEETS_SPREADSHEET_ID || '') as string;

export const isGoogleSheetsConfigured =
  GOOGLE_SHEETS_API_KEY.length > 0 &&
  GOOGLE_SHEETS_SPREADSHEET_ID.length > 0 &&
  GOOGLE_SHEETS_API_KEY !== 'your-google-sheets-api-key' &&
  GOOGLE_SHEETS_SPREADSHEET_ID !== 'your-google-sheets-spreadsheet-id';

function toNumber(value: string | undefined, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toBoolean(value: string | undefined) {
  if (!value) return false;
  const normalized = value.trim().toLowerCase();
  return normalized === 'true' || normalized === 'yes' || normalized === '1';
}

function normalizeKey(key: string) {
  return key.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function mapRows(values: string[][]) {
  if (!values.length) return [] as Record<string, string>[];
  const headers = values[0].map(normalizeKey);
  return values.slice(1).map((row) => {
    const mapped: Record<string, string> = {};
    headers.forEach((header, index) => {
      mapped[header] = row[index] || '';
    });
    return mapped;
  });
}

export async function fetchFromGoogleSheets(
  spreadsheetId: string,
  range: string,
): Promise<SheetData> {
  if (!GOOGLE_SHEETS_API_KEY) {
    throw new Error('VITE_GOOGLE_SHEETS_API_KEY is missing.');
  }

  const url = new URL(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}`,
  );
  url.searchParams.set('key', GOOGLE_SHEETS_API_KEY);

  const response = await fetch(url.toString());
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Google Sheets API error (${response.status}): ${text}`);
  }

  const data = await response.json();
  return {
    range: data.range || range,
    values: data.values || [],
  };
}

export interface GoogleSheetsRanges {
  goals?: string;
  offices?: string;
  users?: string;
  kpis?: string;
  monthlyAccomplishments?: string;
  issues?: string;
  movs?: string;
}

const defaultRanges: Required<GoogleSheetsRanges> = {
  goals: 'Goals!A1:Z',
  offices: 'Offices!A1:Z',
  users: 'Users!A1:Z',
  kpis: 'KPIs!A1:Z',
  monthlyAccomplishments: 'MonthlyAccomplishments!A1:Z',
  issues: 'Issues!A1:Z',
  movs: 'MOVs!A1:Z',
};

function parseGoals(values: string[][]): Goal[] {
  return mapRows(values).map((row) => ({
    id: row.id,
    number: toNumber(row.number),
    name: row.name,
    description: row.description,
  })).filter((goal) => goal.id && goal.name);
}

function parseOffices(values: string[][]): Office[] {
  return mapRows(values).map((row) => ({
    id: row.id,
    name: row.name,
    code: row.code,
    focalPerson: row.focalperson || row.focal || row.focalpersonname || '',
  })).filter((office) => office.id && office.name);
}

function parseUsers(values: string[][]): User[] {
  return mapRows(values).map((row) => ({
    id: row.id,
    name: row.name,
    email: row.email,
    role: (row.role as User['role']) || 'encoder',
    office: row.office,
  })).filter((user) => user.id && user.name);
}

function parseKpis(values: string[][]): KPI[] {
  return mapRows(values).map((row) => ({
    id: row.id || `kpi-${normalizeKey(row.sourcesheet || 'sheet')}-${row.sourcerow || Math.random().toString(36).slice(2, 8)}`,
    code: row.code || `KPI-${row.sourcerow || row.id || ''}`,
    name: row.name || row.kpistrategicmeasure || row.kpimeasure || '',
    description: row.description || row.strategicobjective || '',
    goalId: row.goalid || `goal-${normalizeKey(row.goal || 'unknown')}`,
    officeId: row.officeid || `office-${normalizeKey(row.assignedofficeunit || row.office || 'unknown')}`,
    target: toNumber(row.target || row.target2026frombsc),
    unit: row.unit || 'count',
    status: (row.status as KPI['status']) || 'not_started',
    submissionStatus: (row.submissionstatus as KPI['submissionStatus']) || 'not_submitted',
    submissionDate: row.submissiondate || undefined,
    focalPerson: row.focalperson || '',
    pillar: row.pillar || undefined,
    assignmentType: row.assignmenttype || undefined,
    perspective: row.perspective || undefined,
    strategicObjective: row.strategicobjective || undefined,
    q1Target: toNumber(row.q1target, NaN),
    targetText: row.target2026frombsc || undefined,
    keyActivitiesOutputs: row.keyactivitiesoutputs || undefined,
    movText: row.meansofverificationmov || undefined,
    bscRemarks: row.bscremarks || undefined,
    sourceSheet: row.sourcesheet || undefined,
    sourceRow: toNumber(row.sourcerow, NaN),
  })).map((kpi) => ({
    ...kpi,
    q1Target: Number.isFinite(kpi.q1Target as number) ? kpi.q1Target : undefined,
    sourceRow: Number.isFinite(kpi.sourceRow as number) ? kpi.sourceRow : undefined,
  })).filter((kpi) => kpi.id && kpi.code && kpi.goalId && kpi.officeId && kpi.name);
}

function parseMonthlyAccomplishments(values: string[][]): MonthlyAccomplishment[] {
  return mapRows(values).map((row) => ({
    id: row.id,
    kpiId: row.kpiid,
    month: row.month as MonthlyAccomplishment['month'],
    accomplishment: toNumber(row.accomplishment),
    percentage: toNumber(row.percentage),
    remarks: row.remarks || undefined,
  })).filter((accomplishment) => accomplishment.id && accomplishment.kpiId && accomplishment.month);
}

function parseIssues(values: string[][]): Issue[] {
  return mapRows(values).map((row) => ({
    id: row.id,
    kpiId: row.kpiid,
    officeId: row.officeid,
    category: row.category,
    description: row.description,
    severity: (row.severity as Issue['severity']) || 'low',
    status: (row.status as Issue['status']) || 'open',
    assistanceNeeded: row.assistanceneeded || undefined,
    dateReported: row.datereported,
  })).filter((issue) => issue.id && issue.kpiId && issue.officeId);
}

function parseMovs(values: string[][]): MOV[] {
  return mapRows(values).map((row) => ({
    id: row.id,
    kpiId: row.kpiid,
    month: row.month,
    fileName: row.filename,
    fileUrl: row.fileurl,
    uploadedBy: row.uploadedby,
    uploadedDate: row.uploadeddate,
    validated: toBoolean(row.validated),
    validatorNotes: row.validatornotes || undefined,
  })).filter((mov) => mov.id && mov.kpiId && mov.fileName);
}

export async function fetchDashboardDataFromGoogleSheets(
  ranges: GoogleSheetsRanges = {},
): Promise<Partial<AppDataSnapshot>> {
  if (!isGoogleSheetsConfigured) {
    return {};
  }

  const resolvedRanges = { ...defaultRanges, ...ranges };
  const spreadsheetId = GOOGLE_SHEETS_SPREADSHEET_ID;

  const [goalsRes, officesRes, usersRes, kpisRes, monthlyRes, issuesRes, movsRes] = await Promise.all([
    fetchFromGoogleSheets(spreadsheetId, resolvedRanges.goals),
    fetchFromGoogleSheets(spreadsheetId, resolvedRanges.offices),
    fetchFromGoogleSheets(spreadsheetId, resolvedRanges.users),
    fetchFromGoogleSheets(spreadsheetId, resolvedRanges.kpis),
    fetchFromGoogleSheets(spreadsheetId, resolvedRanges.monthlyAccomplishments),
    fetchFromGoogleSheets(spreadsheetId, resolvedRanges.issues),
    fetchFromGoogleSheets(spreadsheetId, resolvedRanges.movs),
  ]);

  return {
    goals: parseGoals(goalsRes.values),
    offices: parseOffices(officesRes.values),
    users: parseUsers(usersRes.values),
    kpis: parseKpis(kpisRes.values),
    monthlyAccomplishments: parseMonthlyAccomplishments(monthlyRes.values),
    issues: parseIssues(issuesRes.values),
    movs: parseMovs(movsRes.values),
  };
}
