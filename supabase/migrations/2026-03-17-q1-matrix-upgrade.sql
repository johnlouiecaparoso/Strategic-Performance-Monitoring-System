-- Idempotent migration for existing SPMS databases
-- Run this in Supabase SQL Editor instead of re-running full schema.sql

-- Add new KPI status value only if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'kpi_status' AND e.enumlabel = 'for_validation'
  ) THEN
    ALTER TYPE kpi_status ADD VALUE 'for_validation';
  END IF;
END $$;

-- KPI metadata fields from Q1 Matrix
ALTER TABLE kpis ADD COLUMN IF NOT EXISTS pillar text;
ALTER TABLE kpis ADD COLUMN IF NOT EXISTS assignment_type text;
ALTER TABLE kpis ADD COLUMN IF NOT EXISTS perspective text;
ALTER TABLE kpis ADD COLUMN IF NOT EXISTS strategic_objective text;
ALTER TABLE kpis ADD COLUMN IF NOT EXISTS q1_target numeric;
ALTER TABLE kpis ADD COLUMN IF NOT EXISTS q2_target numeric;
ALTER TABLE kpis ADD COLUMN IF NOT EXISTS q3_target numeric;
ALTER TABLE kpis ADD COLUMN IF NOT EXISTS q4_target numeric;
ALTER TABLE kpis ADD COLUMN IF NOT EXISTS target_text text;
ALTER TABLE kpis ADD COLUMN IF NOT EXISTS key_activities_outputs text;
ALTER TABLE kpis ADD COLUMN IF NOT EXISTS means_of_verification text;
ALTER TABLE kpis ADD COLUMN IF NOT EXISTS mov_text text;
ALTER TABLE kpis ADD COLUMN IF NOT EXISTS issues_challenges text;
ALTER TABLE kpis ADD COLUMN IF NOT EXISTS assistance_needed_recommendations text;
ALTER TABLE kpis ADD COLUMN IF NOT EXISTS validation_state text;
ALTER TABLE kpis ADD COLUMN IF NOT EXISTS bsc_remarks text;
ALTER TABLE kpis ADD COLUMN IF NOT EXISTS source_sheet text;
ALTER TABLE kpis ADD COLUMN IF NOT EXISTS source_row int;

-- Assignments table for Strategic/Core/Support row modeling
CREATE TABLE IF NOT EXISTS kpi_assignments (
  id                 text PRIMARY KEY,
  kpi_id             text NOT NULL REFERENCES kpis(id) ON DELETE CASCADE,
  assigned_office_unit text NOT NULL,
  assignment_type    text,
  pillar             text,
  focal_person       text,
  source_sheet       text,
  source_row         int,
  created_at         timestamptz DEFAULT now(),
  UNIQUE(kpi_id, assigned_office_unit, assignment_type)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_kpis_source ON kpis(source_sheet, source_row);
CREATE INDEX IF NOT EXISTS idx_kpi_assignments_kpi_id ON kpi_assignments(kpi_id);

-- RLS + policies
ALTER TABLE kpi_assignments ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'kpi_assignments'
      AND policyname = 'Authenticated read kpi assignments'
  ) THEN
    CREATE POLICY "Authenticated read kpi assignments"
      ON kpi_assignments FOR SELECT TO authenticated USING (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'kpi_assignments'
      AND policyname = 'Admin insert kpi assignments'
  ) THEN
    CREATE POLICY "Admin insert kpi assignments"
      ON kpi_assignments FOR INSERT TO authenticated
      WITH CHECK ((SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin','encoder'));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'kpi_assignments'
      AND policyname = 'Admin update kpi assignments'
  ) THEN
    CREATE POLICY "Admin update kpi assignments"
      ON kpi_assignments FOR UPDATE TO authenticated
      USING ((SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin','encoder'));
  END IF;
END $$;
