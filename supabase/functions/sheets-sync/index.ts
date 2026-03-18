/**
 * Supabase Edge Function: sheets-sync
 *
 * Receives a webhook POST from a Google Apps Script, which sends rows from
 * one Google Sheet tab at a time. The function validates the shared secret,
 * maps the incoming camelCase/flat fields to Supabase snake_case columns,
 * and performs an upsert so re-runs are safely idempotent.
 *
 * ── Deploy ──────────────────────────────────────────────────────────────────
 *   supabase functions deploy sheets-sync --no-verify-jwt
 *
 * ── Environment secrets (set in Supabase dashboard → Edge Functions) ────────
 *   SHEETS_SYNC_SECRET   A shared secret string; Apps Script sends it in the
 *                        Authorization header as "Bearer <secret>"
 *
 * ── Expected request body ───────────────────────────────────────────────────
 * {
 *   "table": "goals" | "offices" | "kpis" | "monthly_accomplishments"
 *            | "issues" | "movs",
 *   "rows": [ { ...fields } ]   // array of row objects from the sheet
 * }
 *
 * ── Google Apps Script snippet ──────────────────────────────────────────────
 * function syncSheetToSupabase(sheetName, tableName) {
 *   const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
 *   const [headers, ...rows] = sheet.getDataRange().getValues();
 *   const payload = rows
 *     .filter(r => r[0]) // skip empty rows
 *     .map(r => Object.fromEntries(headers.map((h, i) => [h, r[i]])));
 *
 *   UrlFetchApp.fetch(EDGE_FUNCTION_URL, {
 *     method: 'post',
 *     contentType: 'application/json',
 *     headers: { Authorization: 'Bearer ' + SHEETS_SYNC_SECRET },
 *     payload: JSON.stringify({ table: tableName, rows: payload }),
 *   });
 * }
 */

import { createClient } from 'npm:@supabase/supabase-js@2';

const ALLOWED_TABLES = [
  'goals',
  'offices',
  'kpis',
  'monthly_accomplishments',
  'issues',
  'movs',
  'kpi_assignments',
  'q1_matrix',
] as const;

type AllowedTable = typeof ALLOWED_TABLES[number];

// ── Normalise header keys sent from Apps Script ───────────────────────────────

function normalizeKey(key: string): string {
  return key.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
}

// ── Column aliases: what Apps Script might send → Supabase column name ────────

const COLUMN_MAP: Record<AllowedTable, Record<string, string>> = {
  goals: {
    id: 'id',
    number: 'number',
    name: 'name',
    description: 'description',
  },
  offices: {
    id: 'id',
    name: 'name',
    code: 'code',
    focalperson: 'focal_person',
    focal: 'focal_person',
    focalpersonname: 'focal_person',
  },
  kpis: {
    id: 'id',
    code: 'code',
    name: 'name',
    description: 'description',
    goalid: 'goal_id',
    officeid: 'office_id',
    target: 'target',
    unit: 'unit',
    status: 'status',
    submissionstatus: 'submission_status',
    submissiondate: 'submission_date',
    focalperson: 'focal_person',
  },
  monthly_accomplishments: {
    id: 'id',
    kpiid: 'kpi_id',
    month: 'month',
    accomplishment: 'accomplishment',
    percentage: 'percentage',
    remarks: 'remarks',
  },
  issues: {
    id: 'id',
    kpiid: 'kpi_id',
    officeid: 'office_id',
    category: 'category',
    description: 'description',
    severity: 'severity',
    status: 'status',
    assistanceneeded: 'assistance_needed',
    datereported: 'date_reported',
  },
  movs: {
    id: 'id',
    kpiid: 'kpi_id',
    month: 'month',
    filename: 'file_name',
    fileurl: 'file_url',
    uploadedby: 'uploaded_by',
    uploadeddate: 'uploaded_date',
    validated: 'validated',
    validatornotes: 'validator_notes',
  },
  kpi_assignments: {
    id: 'id',
    kpiid: 'kpi_id',
    assignedofficeunit: 'assigned_office_unit',
    assignmenttype: 'assignment_type',
    pillar: 'pillar',
    focalperson: 'focal_person',
    sourcesheet: 'source_sheet',
    sourcerow: 'source_row',
  },
  q1_matrix: {
    assignedofficeunit: 'assigned_office_unit',
    pillar: 'pillar',
    assignmenttype: 'assignment_type',
    goal: 'goal',
    perspective: 'perspective',
    strategicobjective: 'strategic_objective',
    kpistrategicmeasure: 'kpi_strategic_measure',
    target2026frombsc: 'target_2026_from_bsc',
    q1target: 'q1_target',
    january: 'january',
    february: 'february',
    march: 'march',
    totalq1accomplishment: 'total_q1_accomplishment',
    accomplishmentvsq1target: 'accomplishment_vs_q1_target',
    keyactivitiesoutputs: 'key_activities_outputs',
    meansofverificationmov: 'means_of_verification_mov',
    status: 'status',
    issueschallenges: 'issues_challenges',
    assistanceneededrecommendations: 'assistance_needed_recommendations',
    focalperson: 'focal_person',
    submissiondate: 'submission_date',
    bscremarks: 'bsc_remarks',
    sourcesheet: 'source_sheet',
    sourcerow: 'source_row',
  },
};

// ── Upsert conflict targets ───────────────────────────────────────────────────

const CONFLICT_TARGETS: Record<AllowedTable, string> = {
  goals: 'id',
  offices: 'id',
  kpis: 'id',
  monthly_accomplishments: 'kpi_id,month',
  issues: 'id',
  movs: 'id',
  kpi_assignments: 'kpi_id,assigned_office_unit,assignment_type',
  q1_matrix: 'id',
};

function slug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

function parseNumeric(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number' && Number.isFinite(value)) return value;

  const asString = String(value).trim();
  if (!asString) return null;
  const cleaned = asString.replace(/[%,$]/g, '');
  const parsed = Number(cleaned);
  if (Number.isFinite(parsed)) return parsed;

  const firstNumber = cleaned.match(/-?\d+(\.\d+)?/);
  if (!firstNumber) return null;
  const fallback = Number(firstNumber[0]);
  return Number.isFinite(fallback) ? fallback : null;
}

function parseDateISO(value: unknown): string | null {
  if (!value) return null;
  const raw = String(value).trim();
  if (!raw) return null;

  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 10);
}

function parseGoal(goalText: string): { id: string; number: number; name: string; description: string } {
  const text = goalText.trim();
  const match = text.match(/goal\s*(\d+)\s*:\s*(.*)/i);
  if (match) {
    const parsedNumber = Number(match[1]);
    const normalizedNumber = parsedNumber === 5 ? 6 : parsedNumber;
    return {
      id: `goal-${normalizedNumber}`,
      number: normalizedNumber,
      name: match[2].trim() || `Goal ${normalizedNumber}`,
      description: text,
    };
  }

  return {
    id: `goal-${slug(text) || 'unknown'}`,
    number: 0,
    name: text || 'Unspecified Goal',
    description: text,
  };
}

function statusToKpiStatus(status: unknown): string {
  const normalized = String(status ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_');

  if (normalized === 'completed') return 'completed';
  if (normalized === 'ongoing') return 'ongoing';
  if (normalized === 'delayed') return 'delayed';
  if (normalized === 'for_validation') return 'for_validation';
  return 'not_started';
}

function statusToSubmissionStatus(submissionDate: string | null): string {
  return submissionDate ? 'submitted' : 'not_submitted';
}

function buildQ1MatrixPayload(rows: Record<string, unknown>[]) {
  const goals = new Map<string, Record<string, unknown>>();
  const offices = new Map<string, Record<string, unknown>>();
  const kpis = new Map<string, Record<string, unknown>>();
  const assignments = new Map<string, Record<string, unknown>>();
  const monthly = new Map<string, Record<string, unknown>>();
  const issues = new Map<string, Record<string, unknown>>();

  const monthDefs = [
    { key: 'january', label: 'January' },
    { key: 'february', label: 'February' },
    { key: 'march', label: 'March' },
  ] as const;

  rows.forEach((rawRow, idx) => {
    const row = transformRow(rawRow, 'q1_matrix');
    const assignedOfficeUnit = String(row.assigned_office_unit ?? '').trim();
    const goalText = String(row.goal ?? '').trim();
    const kpiMeasure = String(row.kpi_strategic_measure ?? '').trim();
    if (!assignedOfficeUnit || !goalText || !kpiMeasure) return;

    const goal = parseGoal(goalText);
    goals.set(goal.id, {
      id: goal.id,
      number: goal.number,
      name: goal.name,
      description: goal.description,
    });

    const officeId = `office-${slug(assignedOfficeUnit) || 'unknown'}`;
    offices.set(officeId, {
      id: officeId,
      name: assignedOfficeUnit,
      code: officeId.toUpperCase().replace(/-/g, '_'),
      focal_person: String(row.focal_person ?? '').trim() || 'Unassigned',
    });

    const sourceSheet = String(row.source_sheet ?? 'Q1 Accomplishment Matrix').trim();
    const sourceRow = Number.parseInt(String(row.source_row ?? ''), 10) || idx + 2;
    const assignmentType = String(row.assignment_type ?? '').trim() || 'Unspecified';
    const kpiId = `kpi-${slug(sourceSheet)}-${sourceRow}-${slug(assignedOfficeUnit)}-${slug(assignmentType)}`;

    const targetRaw = row.target_2026_from_bsc;
    const q1Target = parseNumeric(row.q1_target);
    const targetNumeric = parseNumeric(targetRaw);
    const submissionDate = parseDateISO(row.submission_date);
    const kpiStatus = statusToKpiStatus(row.status);

    kpis.set(kpiId, {
      id: kpiId,
      code: kpiId.toUpperCase().replace(/-/g, '_'),
      name: kpiMeasure,
      description: String(row.strategic_objective ?? '').trim() || null,
      goal_id: goal.id,
      office_id: officeId,
      target: targetNumeric ?? 0,
      unit: 'count',
      status: kpiStatus,
      submission_status: statusToSubmissionStatus(submissionDate),
      submission_date: submissionDate,
      focal_person: String(row.focal_person ?? '').trim() || 'Unassigned',
      pillar: String(row.pillar ?? '').trim() || null,
      assignment_type: assignmentType,
      perspective: String(row.perspective ?? '').trim() || null,
      strategic_objective: String(row.strategic_objective ?? '').trim() || null,
      q1_target: q1Target,
      target_text: targetRaw ? String(targetRaw).trim() : null,
      key_activities_outputs: String(row.key_activities_outputs ?? '').trim() || null,
      mov_text: String(row.means_of_verification_mov ?? '').trim() || null,
      bsc_remarks: String(row.bsc_remarks ?? '').trim() || null,
      source_sheet: sourceSheet,
      source_row: sourceRow,
      updated_at: new Date().toISOString(),
    });

    const assignmentId = `${kpiId}-${slug(assignedOfficeUnit)}-${slug(assignmentType)}`;
    assignments.set(assignmentId, {
      id: assignmentId,
      kpi_id: kpiId,
      assigned_office_unit: assignedOfficeUnit,
      assignment_type: assignmentType,
      pillar: String(row.pillar ?? '').trim() || null,
      focal_person: String(row.focal_person ?? '').trim() || null,
      source_sheet: sourceSheet,
      source_row: sourceRow,
    });

    monthDefs.forEach((monthDef) => {
      const value = parseNumeric(row[monthDef.key]);
      if (value === null) return;
      const percentage = q1Target && q1Target > 0 ? (value / q1Target) * 100 : 0;
      monthly.set(`${kpiId}-${monthDef.label}`, {
        id: `${kpiId}-${monthDef.label.toLowerCase()}`,
        kpi_id: kpiId,
        month: monthDef.label,
        accomplishment: value,
        percentage,
        remarks: String(row.bsc_remarks ?? '').trim() || null,
      });
    });

    const hasQ1MonthlyData = monthDefs.some((monthDef) => {
      const value = parseNumeric(row[monthDef.key]);
      return value !== null && value > 0;
    });

    if (!hasQ1MonthlyData) {
      const totalQ1Value = parseNumeric(row.total_q1_accomplishment);
      if (totalQ1Value !== null && totalQ1Value > 0) {
        const percentage = q1Target && q1Target > 0 ? (totalQ1Value / q1Target) * 100 : 0;
        monthly.set(`${kpiId}-March`, {
          id: `${kpiId}-march`,
          kpi_id: kpiId,
          month: 'March',
          accomplishment: totalQ1Value,
          percentage,
          remarks: 'Derived from Total Q1 Accomplishment',
        });
      }
    }

    const issueText = String(row.issues_challenges ?? '').trim();
    const assistanceText = String(row.assistance_needed_recommendations ?? '').trim();
    if (issueText || assistanceText) {
      issues.set(`issue-${kpiId}`, {
        id: `issue-${kpiId}`,
        kpi_id: kpiId,
        office_id: officeId,
        category: 'General',
        description: issueText || 'Assistance requested',
        severity: (kpiStatus === 'delayed' ? 'high' : 'medium'),
        status: 'open',
        assistance_needed: assistanceText || null,
        date_reported: submissionDate || new Date().toISOString().slice(0, 10),
      });
    }
  });

  return {
    goals: [...goals.values()],
    offices: [...offices.values()],
    kpis: [...kpis.values()],
    assignments: [...assignments.values()],
    monthly: [...monthly.values()],
    issues: [...issues.values()],
  };
}

// ── Row transformation ────────────────────────────────────────────────────────

function transformRow(
  rawRow: Record<string, unknown>,
  table: AllowedTable,
): Record<string, unknown> {
  const columnMap = COLUMN_MAP[table];
  const transformed: Record<string, unknown> = {};

  for (const [rawKey, value] of Object.entries(rawRow)) {
    const normalizedKey = normalizeKey(rawKey);
    const mappedKey = columnMap[normalizedKey];
    if (!mappedKey || value === '' || value === undefined) continue;

    // Type coercions
    if (mappedKey === 'validated') {
      const str = String(value).trim().toLowerCase();
      transformed[mappedKey] = str === 'true' || str === 'yes' || str === '1';
    } else if (['target', 'accomplishment', 'percentage', 'number'].includes(mappedKey)) {
      const num = parseNumeric(value);
      transformed[mappedKey] = num ?? 0;
    } else if (mappedKey === 'source_row') {
      transformed[mappedKey] = Number.parseInt(String(value), 10) || null;
    } else {
      transformed[mappedKey] = value;
    }
  }

  return transformed;
}

// ── Handler ───────────────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  // CORS pre-flight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Authorization, Content-Type',
      },
    });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // ── Auth ─────────────────────────────────────────────────────────────────
  const sharedSecret = Deno.env.get('SHEETS_SYNC_SECRET');
  const authHeader = req.headers.get('Authorization') ?? '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';

  if (!sharedSecret || token !== sharedSecret) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // ── Parse body ───────────────────────────────────────────────────────────
  let body: { table: string; rows: Record<string, unknown>[] };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { table, rows } = body;

  if (!ALLOWED_TABLES.includes(table as AllowedTable)) {
    return new Response(
      JSON.stringify({ error: `Unknown table "${table}". Allowed: ${ALLOWED_TABLES.join(', ')}` }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    );
  }

  if (!Array.isArray(rows) || rows.length === 0) {
    return new Response(JSON.stringify({ error: '`rows` must be a non-empty array' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // ── Transform and upsert ──────────────────────────────────────────────────
  const allowedTable = table as AllowedTable;
  const transformedRows = rows
    .map((r) => transformRow(r, allowedTable))
    .filter((r) => Object.keys(r).length > 0);

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  const client = createClient(supabaseUrl, serviceKey);

  if (allowedTable === 'q1_matrix') {
    const payload = buildQ1MatrixPayload(rows);

    const { error: goalsError } = await client.from('goals').upsert(payload.goals, {
      onConflict: 'id',
      count: 'exact',
    });
    if (goalsError) {
      return new Response(JSON.stringify({ error: goalsError.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { error: officesError } = await client.from('offices').upsert(payload.offices, {
      onConflict: 'id',
      count: 'exact',
    });
    if (officesError) {
      return new Response(JSON.stringify({ error: officesError.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { error: kpisError } = await client.from('kpis').upsert(payload.kpis, {
      onConflict: 'id',
      count: 'exact',
    });
    if (kpisError) {
      return new Response(JSON.stringify({ error: kpisError.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { error: assignmentError } = await client
      .from('kpi_assignments')
      .upsert(payload.assignments, { onConflict: 'kpi_id,assigned_office_unit,assignment_type', count: 'exact' });
    if (assignmentError) {
      return new Response(JSON.stringify({ error: assignmentError.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { error: monthlyError } = await client
      .from('monthly_accomplishments')
      .upsert(payload.monthly, { onConflict: 'kpi_id,month', count: 'exact' });
    if (monthlyError) {
      return new Response(JSON.stringify({ error: monthlyError.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (payload.issues.length > 0) {
      const { error: issuesError } = await client
        .from('issues')
        .upsert(payload.issues, { onConflict: 'id', count: 'exact' });
      if (issuesError) {
        return new Response(JSON.stringify({ error: issuesError.message }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        table: allowedTable,
        upserted: {
          goals: payload.goals.length,
          offices: payload.offices.length,
          kpis: payload.kpis.length,
          assignments: payload.assignments.length,
          monthly: payload.monthly.length,
          issues: payload.issues.length,
        },
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    );
  }

  const { error, count } = await client
    .from(allowedTable)
    .upsert(transformedRows, { onConflict: CONFLICT_TARGETS[allowedTable], count: 'exact' });

  if (error) {
    console.error(`[sheets-sync] upsert error for table "${allowedTable}":`, error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(
    JSON.stringify({ success: true, table: allowedTable, upserted: count }),
    { status: 200, headers: { 'Content-Type': 'application/json' } },
  );
});
