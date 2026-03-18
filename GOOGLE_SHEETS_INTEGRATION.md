# Google Sheets Integration Guide

This document provides instructions for integrating Google Sheets with the Division for Strategic Foresight and Management (DSFM) dashboard.

## Overview

The system is designed to work with Google Sheets as a backup data source and for external data collection. The recommended architecture is:

- **Google Sheets**: Initial data collection and external editing
- **Supabase**: Primary database for all records, user management, and permissions
- **Sync Process**: Periodic import from Google Sheets to Supabase

## Setup Instructions

### 1. Google Cloud Console Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google Sheets API:
   - Navigate to "APIs & Services" > "Library"
   - Search for "Google Sheets API"
   - Click "Enable"

### 2. Create Credentials

**Option A: API Key (for read-only access to public sheets)**
1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "API Key"
3. Copy the API key for later use

**Option B: Service Account (for full access)**
1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "Service Account"
3. Fill in the service account details
4. Download the JSON key file
5. Share your Google Sheet with the service account email address

### 3. Frontend Configuration (already implemented)

Set these environment variables in `.env`:

```env
VITE_GOOGLE_SHEETS_API_KEY=your_api_key_here
VITE_GOOGLE_SHEETS_SPREADSHEET_ID=your_spreadsheet_id_here
VITE_GOOGLE_SHEETS_SYNC_INTERVAL_MS=30000
```

Notes:
- The app uses Google Sheets REST API directly from the frontend for read-only sync.
- No additional npm package is required for this approach.

### 4. Set Up Environment Variables

Create a `.env` file in your project root:

```env
# For API Key authentication
GOOGLE_SHEETS_API_KEY=your_api_key_here

# For Service Account authentication
GOOGLE_SERVICE_ACCOUNT_EMAIL=your_service_account@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n

# Your spreadsheet ID (found in the URL)
GOOGLE_SHEETS_SPREADSHEET_ID=your_spreadsheet_id_here
```

### 5. Data Columns

Your Google Sheet should have the following columns (adjust as needed):

| Column | Description |
|--------|-------------|
| KPI Code | Unique identifier (e.g., KPI-001) |
| KPI Name | Name of the KPI |
| Description | Detailed description |
| Goal | Goal number (1-5) |
| Office | Office name or code |
| Target | Numeric target value |
| Unit | Unit of measurement |
| January | January accomplishment |
| February | February accomplishment |
| March | March accomplishment |
| Status | completed, ongoing, delayed, not_started |
| Submission Date | Date submitted (YYYY-MM-DD) |
| Focal Person | Name of responsible person |
| Issues/Challenges | Any reported issues |
| Assistance Needed | Type of assistance required |
| MOV Submitted | Yes/No |

### 6. Implemented Sync Behavior

The app now reads these tabs and ranges by default:

- `Goals!A1:Z`
- `Offices!A1:Z`
- `Users!A1:Z`
- `KPIs!A1:Z`
- `MonthlyAccomplishments!A1:Z`
- `Issues!A1:Z`
- `MOVs!A1:Z`

Auto-refresh behavior:
- Pulls once on app load.
- Polls Google Sheets every `VITE_GOOGLE_SHEETS_SYNC_INTERVAL_MS` milliseconds.
- Any updated row values from Sheets are reflected in dashboard views automatically.

## Syncing Data to Supabase

### Q1 Accomplishment Matrix (single-sheet mode)

If your source is a single wide sheet (`Q1 Accomplishment Matrix`) instead of separate tabs, use the provided Apps Script at `scripts/google-sheets-sync.gs`.

What it does:
- Reads all rows from `Q1 Accomplishment Matrix`.
- Sends them to Supabase Edge Function as `{ table: 'q1_matrix', rows: [...] }`.
- Edge function normalizes each row into `goals`, `offices`, `kpis`, `kpi_assignments`, `monthly_accomplishments`, and `issues`.

Required setup:
1. Deploy latest Edge Function:
  - `supabase functions deploy sheets-sync --no-verify-jwt`
2. Ensure Edge Function secret exists:
  - `SHEETS_SYNC_SECRET`
3. In Google Apps Script, set:
  - `EDGE_FUNCTION_URL`
  - `SHEETS_SYNC_SECRET`
  - `MATRIX_SHEET_NAME`
4. Run `syncQ1MatrixToSupabase()`.

### Manual Sync Process

1. Admin navigates to the sync dashboard
2. Clicks "Import from Google Sheets"
3. System fetches data from Google Sheets
4. Validates data format
5. Updates/inserts records in Supabase
6. Shows sync summary (success/errors)

### Automated Sync (Optional)

Set up a cron job or scheduled function to run sync automatically:

```typescript
// Example using Vercel Cron Jobs
export async function GET() {
  const result = await syncFromGoogleSheets(
    process.env.GOOGLE_SHEETS_SPREADSHEET_ID!
  );
  
  return Response.json(result);
}
```

## Data Flow

```
Google Sheets (External Collection)
        ↓
    Sync Process
        ↓
  Supabase Database (Primary Storage)
        ↓
  React Dashboard (Display)
```

## Best Practices

1. **Use Google Sheets for**:
   - Initial data collection from offices
   - Temporary external editing when offices don't have system access
   - Backup and export of current data
   - Bulk data imports

2. **Use Supabase for**:
   - All operational data storage
   - User authentication and roles
   - Real-time data updates
   - MOV file uploads
   - Validation workflows
   - Audit trails

3. **Security**:
   - Never commit API keys or credentials to version control
   - Use environment variables for all sensitive data
   - Limit Google Sheets access to read-only when possible
   - Validate all data before importing to Supabase

4. **Data Validation**:
   - Check for duplicate KPI codes
   - Validate date formats
   - Ensure required fields are present
   - Verify numeric values are valid
   - Match office and goal names to existing records

## Troubleshooting

### Common Issues

1. **Authentication Error**
   - Verify API key or service account credentials
   - Check if API is enabled in Google Cloud Console
   - Ensure sheet is shared with service account

2. **Data Not Syncing**
   - Check spreadsheet ID is correct
   - Verify range notation (e.g., "Sheet1!A1:P100")
   - Ensure column headers match expected format

3. **Permission Denied**
   - Share the Google Sheet with the service account email
   - Check API permissions in Google Cloud Console

## Sample Sync Dashboard Component

```typescript
function SyncDashboard() {
  const [syncing, setSyncing] = useState(false);
  
  const handleSync = async () => {
    setSyncing(true);
    try {
      const result = await syncFromGoogleSheets(SPREADSHEET_ID);
      toast.success(`Imported ${result.recordsImported} records`);
    } catch (error) {
      toast.error('Sync failed: ' + error.message);
    } finally {
      setSyncing(false);
    }
  };
  
  return (
    <Button onClick={handleSync} disabled={syncing}>
      {syncing ? 'Syncing...' : 'Import from Google Sheets'}
    </Button>
  );
}
```

## Support

For additional help with Google Sheets integration:
- [Google Sheets API Documentation](https://developers.google.com/sheets/api)
- [googleapis npm package](https://www.npmjs.com/package/googleapis)
- [Google Cloud Console](https://console.cloud.google.com/)
