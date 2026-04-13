import type { Goal, Issue, KPI, MonthlyAccomplishment, MOV, Office, User } from '../types';
import type { AppDataSnapshot } from '../data/store';
import { normalizeAssignmentType, normalizeKpiStatus } from './bscGovernance';

export interface SheetData {
  range: string;
  values: string[][];
}

export interface SyncIssue {
  rowNumber: number;
  reason: string;
  identifier?: string;
}

export interface EntitySyncHealth {
  sheetName: string;
  totalRows: number;
  parsedRows: number;
  droppedRows: number;
  droppedByReason: Record<string, number>;
  droppedSample: SyncIssue[];
}

export interface GoogleSheetsSyncHealth {
  fetchedAt: string;
  entities: {
    goals: EntitySyncHealth;
    offices: EntitySyncHealth;
    users: EntitySyncHealth;
    kpis: EntitySyncHealth;
    monthlyAccomplishments: EntitySyncHealth;
    issues: EntitySyncHealth;
    movs: EntitySyncHealth;
  };
}

export interface GoogleSheetsFetchResult {
  data: Partial<AppDataSnapshot>;
  health: GoogleSheetsSyncHealth;
}

const GOOGLE_SHEETS_API_KEY = (import.meta.env.VITE_GOOGLE_SHEETS_API_KEY || '') as string;
const GOOGLE_SHEETS_SPREADSHEET_ID = (import.meta.env.VITE_GOOGLE_SHEETS_SPREADSHEET_ID || '') as string;

export const isGoogleSheetsConfigured =
  GOOGLE_SHEETS_API_KEY.length > 0 &&
  GOOGLE_SHEETS_SPREADSHEET_ID.length > 0 &&
  GOOGLE_SHEETS_API_KEY !== 'your-google-sheets-api-key' &&
  GOOGLE_SHEETS_SPREADSHEET_ID !== 'your-google-sheets-spreadsheet-id';

function toNumber(value: string | undefined, fallback = 0) {
  if (value === undefined || value === null) return fallback;
  const normalized = String(value).trim();
  if (!normalized) return fallback;

  const cleaned = normalized.replace(/[,%$\s]/g, '');
  const parsed = Number(cleaned);
  if (Number.isFinite(parsed)) return parsed;

  const firstNumber = cleaned.match(/-?\d+(\.\d+)?/);
  if (!firstNumber) return fallback;
  const fallbackParsed = Number(firstNumber[0]);
  return Number.isFinite(fallbackParsed) ? fallbackParsed : fallback;
}

function toBoolean(value: string | undefined) {
  if (!value) return false;
  const normalized = value.trim().toLowerCase();
  return normalized === 'true' || normalized === 'yes' || normalized === '1';
}

function normalizeKey(key: string) {
  return key.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function inferSheetName(range: string) {
  return range.split('!')[0] || 'Unknown';
}

function initEntityHealth(sheetName: string, totalRows: number): EntitySyncHealth {
  return {
    sheetName,
    totalRows,
    parsedRows: 0,
    droppedRows: 0,
    droppedByReason: {},
    droppedSample: [],
  };
}

function addDropIssue(health: EntitySyncHealth, issue: SyncIssue) {
  health.droppedRows += 1;
  health.droppedByReason[issue.reason] = (health.droppedByReason[issue.reason] || 0) + 1;
  if (health.droppedSample.length < 12) {
    health.droppedSample.push(issue);
  }
}

function fallbackKpiId(row: Record<string, string>) {
  const sourceSheet = normalizeKey(row.sourcesheet || 'sheet');
  const sourceRow = normalizeKey(row.sourcerow || '');
  const code = normalizeKey(row.code || '');
  const name = normalizeKey(row.name || row.kpistrategicmeasure || row.kpimeasure || '');
  const office = normalizeKey(row.officeid || row.assignedofficeunit || row.office || '');
  const goal = normalizeKey(row.goalid || row.goal || '');

  if (sourceRow) {
    return `kpi-${sourceSheet}-${sourceRow}`;
  }

  if (code) {
    return `kpi-${code}`;
  }

  return `kpi-${sourceSheet}-${office || 'unknown'}-${goal || 'unknown'}-${name || 'unknown'}`;
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

function mapRowsWithMeta(values: string[][]) {
  if (!values.length) return [] as { rowNumber: number; row: Record<string, string> }[];
  const headers = values[0].map(normalizeKey);
  return values.slice(1).map((row, idx) => {
    const mapped: Record<string, string> = {};
    headers.forEach((header, index) => {
      mapped[header] = row[index] || '';
    });
    return {
      rowNumber: idx + 2,
      row: mapped,
    };
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
    id: row.id || fallbackKpiId(row),
    code: row.code || `KPI-${row.sourcerow || row.id || ''}`,
    name: row.name || row.kpistrategicmeasure || row.kpimeasure || '',
    description: row.description || row.strategicobjective || '',
    goalId: row.goalid || `goal-${normalizeKey(row.goal || 'unknown')}`,
    officeId: row.officeid || `office-${normalizeKey(row.assignedofficeunit || row.office || 'unknown')}`,
    target: toNumber(row.target || row.target2026frombsc),
    unit: row.unit || 'count',
    status: normalizeKpiStatus(row.status),
    submissionStatus: (row.submissionstatus as KPI['submissionStatus']) || 'not_submitted',
    submissionDate: row.submissiondate || undefined,
    focalPerson: row.focalperson || '',
    pillar: row.pillar || undefined,
    assignmentType: normalizeAssignmentType(row.assignmenttype),
    perspective: row.perspective || undefined,
    strategicObjective: row.strategicobjective || undefined,
    q1Target: toNumber(row.q1target, NaN),
    q2Target: toNumber(row.q2target, NaN),
    q3Target: toNumber(row.q3target, NaN),
    q4Target: toNumber(row.q4target, NaN),
    targetText: row.target2026frombsc || undefined,
    keyActivitiesOutputs: row.keyactivitiesoutputs || undefined,
    meansOfVerification: row.meansofverification || row.meansofverificationmov || undefined,
    movText: row.meansofverificationmov || undefined,
    issuesChallenges: row.issueschallenges || undefined,
    assistanceNeededRecommendations: row.assistanceneededrecommendations || undefined,
    validationState: (row.validationstate as KPI['validationState']) || undefined,
    bscRemarks: row.bscremarks || undefined,
    sourceSheet: row.sourcesheet || undefined,
    sourceRow: toNumber(row.sourcerow, NaN),
  })).map((kpi) => ({
    ...kpi,
    q1Target: Number.isFinite(kpi.q1Target as number) ? kpi.q1Target : undefined,
    q2Target: Number.isFinite(kpi.q2Target as number) ? kpi.q2Target : undefined,
    q3Target: Number.isFinite(kpi.q3Target as number) ? kpi.q3Target : undefined,
    q4Target: Number.isFinite(kpi.q4Target as number) ? kpi.q4Target : undefined,
    sourceRow: Number.isFinite(kpi.sourceRow as number) ? kpi.sourceRow : undefined,
  })).filter((kpi) => kpi.id && kpi.code && kpi.goalId && kpi.officeId && kpi.name);
}

function parseKpisWithHealth(values: string[][], sheetName: string) {
  const totalRows = Math.max(values.length - 1, 0);
  const health = initEntityHealth(sheetName, totalRows);
  const items: KPI[] = [];

  mapRowsWithMeta(values).forEach(({ row, rowNumber }) => {
    const kpi = {
      id: row.id || fallbackKpiId(row),
      code: row.code || `KPI-${row.sourcerow || row.id || ''}`,
      name: row.name || row.kpistrategicmeasure || row.kpimeasure || '',
      description: row.description || row.strategicobjective || '',
      goalId: row.goalid || `goal-${normalizeKey(row.goal || 'unknown')}`,
      officeId: row.officeid || `office-${normalizeKey(row.assignedofficeunit || row.office || 'unknown')}`,
      target: toNumber(row.target || row.target2026frombsc),
      unit: row.unit || 'count',
      status: normalizeKpiStatus(row.status),
      submissionStatus: (row.submissionstatus as KPI['submissionStatus']) || 'not_submitted',
      submissionDate: row.submissiondate || undefined,
      focalPerson: row.focalperson || '',
      pillar: row.pillar || undefined,
      assignmentType: normalizeAssignmentType(row.assignmenttype),
      perspective: row.perspective || undefined,
      strategicObjective: row.strategicobjective || undefined,
      q1Target: toNumber(row.q1target, NaN),
      q2Target: toNumber(row.q2target, NaN),
      q3Target: toNumber(row.q3target, NaN),
      q4Target: toNumber(row.q4target, NaN),
      targetText: row.target2026frombsc || undefined,
      keyActivitiesOutputs: row.keyactivitiesoutputs || undefined,
      meansOfVerification: row.meansofverification || row.meansofverificationmov || undefined,
      movText: row.meansofverificationmov || undefined,
      issuesChallenges: row.issueschallenges || undefined,
      assistanceNeededRecommendations: row.assistanceneededrecommendations || undefined,
      validationState: (row.validationstate as KPI['validationState']) || undefined,
      bscRemarks: row.bscremarks || undefined,
      sourceSheet: row.sourcesheet || undefined,
      sourceRow: toNumber(row.sourcerow, NaN),
    } as KPI;

    const normalizedKpi = {
      ...kpi,
      q1Target: Number.isFinite(kpi.q1Target as number) ? kpi.q1Target : undefined,
      q2Target: Number.isFinite(kpi.q2Target as number) ? kpi.q2Target : undefined,
      q3Target: Number.isFinite(kpi.q3Target as number) ? kpi.q3Target : undefined,
      q4Target: Number.isFinite(kpi.q4Target as number) ? kpi.q4Target : undefined,
      sourceRow: Number.isFinite(kpi.sourceRow as number) ? kpi.sourceRow : undefined,
    };

    const missing: string[] = [];
    if (!normalizedKpi.name) missing.push('name');
    if (!normalizedKpi.goalId || normalizedKpi.goalId === 'goal-unknown') missing.push('goal');
    if (!normalizedKpi.officeId || normalizedKpi.officeId === 'office-unknown') missing.push('office');

    if (missing.length > 0) {
      addDropIssue(health, {
        rowNumber,
        reason: `missing_${missing.join('_')}`,
        identifier: row.code || row.kpistrategicmeasure || row.kpimeasure || row.id || '',
      });
      return;
    }

    health.parsedRows += 1;
    items.push(normalizedKpi);
  });

  return { items, health };
}

function summarizeGenericEntity(
  itemsLength: number,
  values: string[][],
  sheetName: string,
): EntitySyncHealth {
  const totalRows = Math.max(values.length - 1, 0);
  const parsedRows = itemsLength;
  const droppedRows = Math.max(totalRows - parsedRows, 0);
  const droppedByReason = droppedRows > 0 ? { filtered_out_or_invalid: droppedRows } : {};
  return {
    sheetName,
    totalRows,
    parsedRows,
    droppedRows,
    droppedByReason,
    droppedSample: [],
  };
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
  const result = await fetchDashboardDataWithHealthFromGoogleSheets(ranges);
  return result.data;
}

export async function fetchDashboardDataWithHealthFromGoogleSheets(
  ranges: GoogleSheetsRanges = {},
): Promise<GoogleSheetsFetchResult> {
  if (!isGoogleSheetsConfigured) {
    const emptyHealth: GoogleSheetsSyncHealth = {
      fetchedAt: new Date().toISOString(),
      entities: {
        goals: initEntityHealth('Goals', 0),
        offices: initEntityHealth('Offices', 0),
        users: initEntityHealth('Users', 0),
        kpis: initEntityHealth('KPIs', 0),
        monthlyAccomplishments: initEntityHealth('MonthlyAccomplishments', 0),
        issues: initEntityHealth('Issues', 0),
        movs: initEntityHealth('MOVs', 0),
      },
    };
    return { data: {}, health: emptyHealth };
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

  const goals = parseGoals(goalsRes.values);
  const offices = parseOffices(officesRes.values);
  const users = parseUsers(usersRes.values);
  const kpisResult = parseKpisWithHealth(kpisRes.values, inferSheetName(kpisRes.range));
  const monthly = parseMonthlyAccomplishments(monthlyRes.values);
  const issues = parseIssues(issuesRes.values);
  const movs = parseMovs(movsRes.values);

  const health: GoogleSheetsSyncHealth = {
    fetchedAt: new Date().toISOString(),
    entities: {
      goals: summarizeGenericEntity(goals.length, goalsRes.values, inferSheetName(goalsRes.range)),
      offices: summarizeGenericEntity(offices.length, officesRes.values, inferSheetName(officesRes.range)),
      users: summarizeGenericEntity(users.length, usersRes.values, inferSheetName(usersRes.range)),
      kpis: kpisResult.health,
      monthlyAccomplishments: summarizeGenericEntity(
        monthly.length,
        monthlyRes.values,
        inferSheetName(monthlyRes.range),
      ),
      issues: summarizeGenericEntity(issues.length, issuesRes.values, inferSheetName(issuesRes.range)),
      movs: summarizeGenericEntity(movs.length, movsRes.values, inferSheetName(movsRes.range)),
    },
  };

  return {
    data: {
      goals,
      offices,
      users,
      kpis: kpisResult.items,
      monthlyAccomplishments: monthly,
      issues,
      movs,
    },
    health,
  };
}
