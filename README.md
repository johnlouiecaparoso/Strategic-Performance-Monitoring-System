
  # Division Website Development

  This is a code bundle for Division Website Development. The original project is available at https://www.figma.com/design/pCH6CogNlwIkj5Tla4EUT5/Division-Website-Development.

  ## Running the code

  Run `npm i` to install the dependencies.

  Run `npm run dev` to start the development server.

  ## Supabase setup

  1. Copy `.env.example` to `.env`.
  2. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` from your Supabase project settings.
  2.1. Optional source selection via `VITE_PRIMARY_DATA_SOURCE`:
    - `supabase` (default): Supabase is primary source.
    - `google_sheets`: Google Sheets polling is primary; Supabase live sync is paused.
  3. Open Supabase SQL Editor and run `supabase/schema.sql`.
  4. Start the app with `npm run dev` and sign in at `/login`.

    ## Google Sheets live sync setup

    1. In `.env`, set:
      - `VITE_GOOGLE_SHEETS_API_KEY`
      - `VITE_GOOGLE_SHEETS_SPREADSHEET_ID`
      - `VITE_GOOGLE_SHEETS_SYNC_INTERVAL_MS` (optional, default `30000`)
      - `VITE_GOOGLE_SHEETS_WITH_SUPABASE` (optional, default `false`)
    2. Ensure your spreadsheet has these tabs with headers in row 1:
      - `Goals`
      - `Offices`
      - `Users`
      - `KPIs`
      - `MonthlyAccomplishments`
      - `Issues`
      - `MOVs`
    3. Share/publish the sheet so your API key can read it.
    4. Run the app. Data is pulled on load and auto-refreshes every interval.

    Notes:

    - If Supabase is configured, Google Sheets polling is disabled by default to avoid data-source conflicts.
    - To run both at the same time, set `VITE_GOOGLE_SHEETS_WITH_SUPABASE=true`.
    - If `VITE_PRIMARY_DATA_SOURCE=google_sheets`, the app treats Google Sheets as source-of-truth and pauses Supabase sync.
    - Use the `Sync Health` button in the top bar to view last sync time, next sync schedule, dropped rows, and recently synced KPI records.

  If `.env` contains placeholder values, the app runs in demo mode using local mock data and mock authentication.
  