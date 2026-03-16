
  # Division Website Development

  This is a code bundle for Division Website Development. The original project is available at https://www.figma.com/design/pCH6CogNlwIkj5Tla4EUT5/Division-Website-Development.

  ## Running the code

  Run `npm i` to install the dependencies.

  Run `npm run dev` to start the development server.

  ## Supabase setup

  1. Copy `.env.example` to `.env`.
  2. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` from your Supabase project settings.
  3. Open Supabase SQL Editor and run `supabase/schema.sql`.
  4. Start the app with `npm run dev` and sign in at `/login`.

    ## Google Sheets live sync setup

    1. In `.env`, set:
      - `VITE_GOOGLE_SHEETS_API_KEY`
      - `VITE_GOOGLE_SHEETS_SPREADSHEET_ID`
      - `VITE_GOOGLE_SHEETS_SYNC_INTERVAL_MS` (optional, default `30000`)
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

  If `.env` contains placeholder values, the app runs in demo mode using local mock data and mock authentication.
  