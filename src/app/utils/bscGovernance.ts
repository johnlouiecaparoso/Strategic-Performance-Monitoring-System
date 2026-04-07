import type { AssignmentType, KPIStatus, MonthName, QuarterName } from '../types';

export type FieldInputType = 'readonly' | 'text' | 'date' | 'dropdown' | 'link' | 'computed' | 'number';

export interface BSCFieldRule {
  key: string;
  label: string;
  type: FieldInputType;
  editable: boolean;
  options?: string[];
}

export const ASSIGNMENT_TYPE_OPTIONS: AssignmentType[] = ['Strategic', 'Core', 'Support'];

export const STATUS_OPTIONS: KPIStatus[] = [
  'not_started',
  'ongoing',
  'completed',
  'delayed',
  'for_validation',
];

export const ALL_MONTHS: MonthName[] = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export const QUARTER_MONTHS: Record<QuarterName, MonthName[]> = {
  Q1: ['January', 'February', 'March'],
  Q2: ['April', 'May', 'June'],
  Q3: ['July', 'August', 'September'],
  Q4: ['October', 'November', 'December'],
};

export const READ_ONLY_FIELD_RULES: BSCFieldRule[] = [
  { key: 'assignedOfficeUnit', label: 'Assigned Office/Unit', type: 'readonly', editable: false },
  { key: 'pillar', label: 'Pillar', type: 'readonly', editable: false },
  { key: 'assignmentType', label: 'Assignment Type', type: 'readonly', editable: false },
  { key: 'goal', label: 'Goal', type: 'readonly', editable: false },
  { key: 'perspective', label: 'Perspective', type: 'readonly', editable: false },
  { key: 'strategicObjective', label: 'Strategic Objective', type: 'readonly', editable: false },
  { key: 'kpiMeasure', label: 'KPI / Strategic Measure', type: 'readonly', editable: false },
  { key: 'targetText', label: '2026 Target (from BSC)', type: 'readonly', editable: false },
];

export const EDITABLE_FIELD_RULES: BSCFieldRule[] = [
  { key: 'q1Target', label: 'Q1 Target', type: 'number', editable: true },
  { key: 'q2Target', label: 'Q2 Target', type: 'number', editable: true },
  { key: 'q3Target', label: 'Q3 Target', type: 'number', editable: true },
  { key: 'q4Target', label: 'Q4 Target', type: 'number', editable: true },
  { key: 'monthlyValues', label: 'Monthly Values (Jan-Dec)', type: 'number', editable: true },
  { key: 'totalQuarterAccomplishment', label: 'Total Accomplishment per Quarter', type: 'computed', editable: false },
  { key: 'quarterAccomplishmentPercent', label: '% Accomplishment vs Quarter Target', type: 'computed', editable: false },
  { key: 'keyActivitiesOutputs', label: 'Key Activities / Outputs', type: 'link', editable: true },
  { key: 'meansOfVerification', label: 'Means of Verification', type: 'link', editable: true },
  { key: 'status', label: 'Status', type: 'dropdown', editable: true, options: STATUS_OPTIONS },
  { key: 'issuesChallenges', label: 'Issues / Challenges', type: 'text', editable: true },
  {
    key: 'assistanceNeededRecommendations',
    label: 'Assistance Needed / Recommendations',
    type: 'text',
    editable: true,
  },
  { key: 'focalPerson', label: 'Focal Person', type: 'text', editable: true },
  { key: 'submissionDate', label: 'Submission Date', type: 'date', editable: true },
];

export function normalizeAssignmentType(value: string | undefined): AssignmentType | undefined {
  if (!value) return undefined;
  const normalized = value.trim().toLowerCase();
  if (normalized === 'strategic') return 'Strategic';
  if (normalized === 'core') return 'Core';
  if (normalized === 'support') return 'Support';
  return undefined;
}

export function normalizeKpiStatus(value: string | undefined): KPIStatus {
  const normalized = (value || '').trim().toLowerCase().replace(/\s+/g, '_');
  if (normalized === 'ongoing') return 'ongoing';
  if (normalized === 'completed') return 'completed';
  if (normalized === 'delayed') return 'delayed';
  if (normalized === 'for_validation') return 'for_validation';
  return 'not_started';
}
