/**
 * Google Apps Script: Sync Q1 Accomplishment Matrix to Supabase Edge Function
 *
 * 1) Open your Google Sheet -> Extensions -> Apps Script
 * 2) Paste this file
 * 3) Set constants below
 * 4) Run syncQ1MatrixToSupabase()
 */

const EDGE_FUNCTION_URL = 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/sheets-sync';
const SHEETS_SYNC_SECRET = 'YOUR_SHEETS_SYNC_SECRET';
const MATRIX_SHEET_NAME = 'Q1 Accomplishment Matrix';
const BATCH_SIZE = 150;

function syncQ1MatrixToSupabase() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = spreadsheet.getSheetByName(MATRIX_SHEET_NAME);

  if (!sheet) {
    throw new Error(`Sheet "${MATRIX_SHEET_NAME}" not found.`);
  }

  const values = sheet.getDataRange().getValues();
  if (values.length < 2) {
    Logger.log('No data rows to sync.');
    return;
  }

  const headers = values[0].map((h) => String(h).trim());
  const rows = values.slice(1).map((row, index) => {
    const record = {};
    headers.forEach((header, columnIndex) => {
      record[header] = row[columnIndex] ?? '';
    });

    if (!record['Source Sheet']) {
      record['Source Sheet'] = MATRIX_SHEET_NAME;
    }
    if (!record['Source Row']) {
      record['Source Row'] = index + 2;
    }

    return record;
  }).filter((record) => {
    return String(record['Assigned Office/Unit'] || '').trim() &&
      String(record['Goal'] || '').trim() &&
      String(record['KPI / Strategic Measure'] || '').trim();
  });

  if (!rows.length) {
    Logger.log('No valid rows after filtering.');
    return;
  }

  let successCount = 0;
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    const payload = {
      table: 'q1_matrix',
      rows: batch,
    };

    const response = UrlFetchApp.fetch(EDGE_FUNCTION_URL, {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(payload),
      muteHttpExceptions: true,
      headers: {
        Authorization: `Bearer ${SHEETS_SYNC_SECRET}`,
      },
    });

    const statusCode = response.getResponseCode();
    const body = response.getContentText();

    if (statusCode >= 200 && statusCode < 300) {
      successCount += batch.length;
      Logger.log(`Batch ${i / BATCH_SIZE + 1}: OK (${batch.length} rows)`);
      Logger.log(body);
    } else {
      Logger.log(`Batch ${i / BATCH_SIZE + 1}: FAILED (${statusCode})`);
      Logger.log(body);
      throw new Error(`Sync failed on batch ${i / BATCH_SIZE + 1}: HTTP ${statusCode}`);
    }
  }

  Logger.log(`Sync completed. Total rows sent: ${successCount}`);
}

function syncAllToSupabase() {
  syncQ1MatrixToSupabase();
}
