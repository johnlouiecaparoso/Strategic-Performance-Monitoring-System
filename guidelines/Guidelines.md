# Strategic Performance Monitoring System — AI Guidelines

## Core principles
- Keep changes minimal, targeted, and reversible.
- Prefer fixing root causes over adding workarounds.
- Preserve existing file structure and naming patterns.
- Do not introduce new dependencies unless strictly required.

## Tech stack and architecture
- The app uses React + Vite + TypeScript and route-driven dashboards under `src/app`.
- Keep app shell and routing concerns in `src/app/App.tsx` and `src/app/routes.tsx`.
- Keep feature UI inside `src/app/components/*` grouped by domain (`dashboards`, `charts`, `auth`, `layout`, `ui`).
- Keep data/domain logic in `src/app/data`, `src/app/hooks`, and `src/app/utils`, not inside presentational components.

## UI and design system
- Reuse existing UI primitives in `src/app/components/ui/*` before creating new components.
- Use theme tokens from `src/styles/theme.css`; avoid hardcoded colors, spacing scales, and font sizes when a token or utility exists.
- Maintain responsive layouts with flex/grid; avoid absolute positioning unless required for overlays/popovers.
- Keep dashboard visuals consistent with existing chart components (`MonthlyTrendChart`, `StatusDonutChart`, `GoalPerformanceChart`).

## Data, auth, and integrations
- Use `AuthContext` and `RequireAuth` for authentication flow; do not duplicate auth state in components.
- For Supabase auth listeners, keep `onAuthStateChange` callbacks synchronous. Do not `await` network/Supabase calls inside those callbacks.
- Keep Google Sheets sync logic in dedicated hook/util files (`useGoogleSheetsSync`, `googleSheets.ts`) and avoid embedding polling logic in dashboard components.
- Maintain demo mode behavior when environment variables are missing or placeholder values are detected.

## TypeScript and code quality
- Use existing shared types from `src/app/types/index.ts`; avoid `any` unless unavoidable.
- Prefer small, composable components and utility functions over large monolithic files.
- Keep naming descriptive and aligned with existing conventions.
- Avoid adding inline comments unless needed to explain non-obvious logic.

## Implementation constraints
- Implement only what is requested; do not add extra pages, modals, filters, or visual effects unless specified.
- Do not refactor unrelated code while fixing a focused issue.
- If behavior is ambiguous, choose the simplest implementation that matches current UX patterns.

## Validation checklist
- Ensure code builds with Vite (`npm run build`) when changes are substantial.
- Verify routing/auth changes against guarded routes and login flow.
- Verify dashboard data rendering in both live-sync and mock/demo modes when relevant.
