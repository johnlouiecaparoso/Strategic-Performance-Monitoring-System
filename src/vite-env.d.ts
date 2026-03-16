/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
  readonly VITE_GOOGLE_SHEETS_API_KEY?: string;
  readonly VITE_GOOGLE_SHEETS_SPREADSHEET_ID?: string;
  readonly VITE_GOOGLE_SHEETS_SYNC_INTERVAL_MS?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
