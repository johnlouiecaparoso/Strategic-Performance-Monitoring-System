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
};

// ── Upsert conflict targets ───────────────────────────────────────────────────

const CONFLICT_TARGETS: Record<AllowedTable, string> = {
  goals: 'id',
  offices: 'id',
  kpis: 'id',
  monthly_accomplishments: 'kpi_id,month',
  issues: 'id',
  movs: 'id',
};

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
      const num = Number(value);
      transformed[mappedKey] = Number.isFinite(num) ? num : 0;
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
