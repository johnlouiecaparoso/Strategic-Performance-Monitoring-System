// Mock data for the Strategic Foresight and Management System
// In production, this would be replaced with Supabase queries

import { Goal, Office, KPI, MonthlyAccomplishment, Issue, MOV, User } from '../types';

export const goals: Goal[] = [
  {
    id: 'goal-1',
    number: 1,
    name: 'Strategic Planning Excellence',
    description: 'Enhance strategic planning capabilities across the organization'
  },
  {
    id: 'goal-2',
    number: 2,
    name: 'Data-Driven Decision Making',
    description: 'Promote evidence-based policy and program development'
  },
  {
    id: 'goal-3',
    number: 3,
    name: 'Innovation and Modernization',
    description: 'Foster innovation and modernize organizational processes'
  },
  {
    id: 'goal-4',
    number: 4,
    name: 'Stakeholder Engagement',
    description: 'Strengthen partnerships and stakeholder collaboration'
  },
  {
    id: 'goal-5',
    number: 5,
    name: 'Capacity Building',
    description: 'Develop organizational and human resource capabilities'
  }
];

export const offices: Office[] = [
  { id: 'off-1', name: 'Office of the Director', code: 'OD', focalPerson: 'Maria Santos' },
  { id: 'off-2', name: 'Planning Division', code: 'PD', focalPerson: 'Juan Cruz' },
  { id: 'off-3', name: 'Research and Development', code: 'RD', focalPerson: 'Ana Reyes' },
  { id: 'off-4', name: 'Policy Analysis Unit', code: 'PAU', focalPerson: 'Carlos Ramos' },
  { id: 'off-5', name: 'Monitoring and Evaluation', code: 'ME', focalPerson: 'Sofia Garcia' },
  { id: 'off-6', name: 'Data Analytics Section', code: 'DAS', focalPerson: 'Miguel Torres' },
  { id: 'off-7', name: 'Strategic Communications', code: 'SC', focalPerson: 'Elena Mendoza' },
  { id: 'off-8', name: 'Innovation Lab', code: 'IL', focalPerson: 'Roberto Del Rosario' }
];

export const users: User[] = [
  { id: 'user-1', name: 'Admin User', email: 'admin@dsfm.gov', role: 'admin', office: 'Office of the Director' },
  { id: 'user-2', name: 'Maria Santos', email: 'maria.santos@dsfm.gov', role: 'encoder', office: 'Office of the Director' },
  { id: 'user-3', name: 'Juan Cruz', email: 'juan.cruz@dsfm.gov', role: 'encoder', office: 'Planning Division' },
  { id: 'user-4', name: 'Validator One', email: 'validator@dsfm.gov', role: 'validator', office: 'Office of the Director' },
  { id: 'user-5', name: 'Executive Viewer', email: 'executive@dsfm.gov', role: 'executive', office: 'Office of the Director' }
];

export const kpis: KPI[] = [
  {
    id: 'kpi-1',
    code: 'KPI-001',
    name: 'Strategic Plans Developed',
    description: 'Number of strategic plans developed and approved',
    goalId: 'goal-1',
    officeId: 'off-2',
    target: 12,
    unit: 'plans',
    status: 'completed',
    submissionStatus: 'submitted',
    submissionDate: '2026-03-10',
    focalPerson: 'Juan Cruz'
  },
  {
    id: 'kpi-2',
    code: 'KPI-002',
    name: 'Policy Papers Published',
    description: 'Number of evidence-based policy papers published',
    goalId: 'goal-2',
    officeId: 'off-4',
    target: 8,
    unit: 'papers',
    status: 'ongoing',
    submissionStatus: 'submitted',
    submissionDate: '2026-03-12',
    focalPerson: 'Carlos Ramos'
  },
  {
    id: 'kpi-3',
    code: 'KPI-003',
    name: 'Research Projects Completed',
    description: 'Number of research projects completed with findings',
    goalId: 'goal-2',
    officeId: 'off-3',
    target: 15,
    unit: 'projects',
    status: 'ongoing',
    submissionStatus: 'submitted',
    submissionDate: '2026-03-11',
    focalPerson: 'Ana Reyes'
  },
  {
    id: 'kpi-4',
    code: 'KPI-004',
    name: 'Innovation Initiatives Launched',
    description: 'Number of innovation initiatives successfully launched',
    goalId: 'goal-3',
    officeId: 'off-8',
    target: 6,
    unit: 'initiatives',
    status: 'delayed',
    submissionStatus: 'late',
    submissionDate: '2026-03-14',
    focalPerson: 'Roberto Del Rosario'
  },
  {
    id: 'kpi-5',
    code: 'KPI-005',
    name: 'Process Improvements Implemented',
    description: 'Number of process improvements successfully implemented',
    goalId: 'goal-3',
    officeId: 'off-5',
    target: 20,
    unit: 'improvements',
    status: 'ongoing',
    submissionStatus: 'submitted',
    submissionDate: '2026-03-09',
    focalPerson: 'Sofia Garcia'
  },
  {
    id: 'kpi-6',
    code: 'KPI-006',
    name: 'Stakeholder Consultations Conducted',
    description: 'Number of stakeholder consultation sessions conducted',
    goalId: 'goal-4',
    officeId: 'off-7',
    target: 24,
    unit: 'sessions',
    status: 'completed',
    submissionStatus: 'submitted',
    submissionDate: '2026-03-08',
    focalPerson: 'Elena Mendoza'
  },
  {
    id: 'kpi-7',
    code: 'KPI-007',
    name: 'Partnership Agreements Signed',
    description: 'Number of new partnership agreements signed',
    goalId: 'goal-4',
    officeId: 'off-1',
    target: 10,
    unit: 'agreements',
    status: 'ongoing',
    submissionStatus: 'not_submitted',
    focalPerson: 'Maria Santos'
  },
  {
    id: 'kpi-8',
    code: 'KPI-008',
    name: 'Training Programs Delivered',
    description: 'Number of capacity building training programs delivered',
    goalId: 'goal-5',
    officeId: 'off-2',
    target: 18,
    unit: 'programs',
    status: 'ongoing',
    submissionStatus: 'submitted',
    submissionDate: '2026-03-13',
    focalPerson: 'Juan Cruz'
  },
  {
    id: 'kpi-9',
    code: 'KPI-009',
    name: 'Data Analytics Reports Generated',
    description: 'Number of comprehensive data analytics reports generated',
    goalId: 'goal-2',
    officeId: 'off-6',
    target: 30,
    unit: 'reports',
    status: 'completed',
    submissionStatus: 'submitted',
    submissionDate: '2026-03-07',
    focalPerson: 'Miguel Torres'
  },
  {
    id: 'kpi-10',
    code: 'KPI-010',
    name: 'Monitoring Missions Conducted',
    description: 'Number of monitoring and evaluation missions conducted',
    goalId: 'goal-1',
    officeId: 'off-5',
    target: 16,
    unit: 'missions',
    status: 'delayed',
    submissionStatus: 'not_submitted',
    focalPerson: 'Sofia Garcia'
  },
  {
    id: 'kpi-11',
    code: 'KPI-011',
    name: 'Communication Campaigns Executed',
    description: 'Number of strategic communication campaigns executed',
    goalId: 'goal-4',
    officeId: 'off-7',
    target: 12,
    unit: 'campaigns',
    status: 'ongoing',
    submissionStatus: 'submitted',
    submissionDate: '2026-03-06',
    focalPerson: 'Elena Mendoza'
  },
  {
    id: 'kpi-12',
    code: 'KPI-012',
    name: 'Staff Development Hours',
    description: 'Total staff development and training hours completed',
    goalId: 'goal-5',
    officeId: 'off-1',
    target: 500,
    unit: 'hours',
    status: 'ongoing',
    submissionStatus: 'not_submitted',
    focalPerson: 'Maria Santos'
  }
];

export const monthlyAccomplishments: MonthlyAccomplishment[] = [
  // KPI-1
  { id: 'acc-1', kpiId: 'kpi-1', month: 'January', accomplishment: 4, percentage: 33.3, remarks: 'On track' },
  { id: 'acc-2', kpiId: 'kpi-1', month: 'February', accomplishment: 4, percentage: 33.3, remarks: 'Good progress' },
  { id: 'acc-3', kpiId: 'kpi-1', month: 'March', accomplishment: 5, percentage: 41.7, remarks: 'Exceeded target' },
  
  // KPI-2
  { id: 'acc-4', kpiId: 'kpi-2', month: 'January', accomplishment: 2, percentage: 25, remarks: 'Started well' },
  { id: 'acc-5', kpiId: 'kpi-2', month: 'February', accomplishment: 3, percentage: 37.5, remarks: 'Progressing' },
  { id: 'acc-6', kpiId: 'kpi-2', month: 'March', accomplishment: 2, percentage: 25, remarks: 'Steady pace' },
  
  // KPI-3
  { id: 'acc-7', kpiId: 'kpi-3', month: 'January', accomplishment: 5, percentage: 33.3, remarks: 'Good start' },
  { id: 'acc-8', kpiId: 'kpi-3', month: 'February', accomplishment: 4, percentage: 26.7, remarks: 'Continuing' },
  { id: 'acc-9', kpiId: 'kpi-3', month: 'March', accomplishment: 5, percentage: 33.3, remarks: 'On schedule' },
  
  // KPI-4
  { id: 'acc-10', kpiId: 'kpi-4', month: 'January', accomplishment: 1, percentage: 16.7, remarks: 'Slow start' },
  { id: 'acc-11', kpiId: 'kpi-4', month: 'February', accomplishment: 1, percentage: 16.7, remarks: 'Challenges encountered' },
  { id: 'acc-12', kpiId: 'kpi-4', month: 'March', accomplishment: 0, percentage: 0, remarks: 'Delayed due to resource constraints' },
  
  // KPI-5
  { id: 'acc-13', kpiId: 'kpi-5', month: 'January', accomplishment: 7, percentage: 35, remarks: 'Strong start' },
  { id: 'acc-14', kpiId: 'kpi-5', month: 'February', accomplishment: 6, percentage: 30, remarks: 'Maintaining momentum' },
  { id: 'acc-15', kpiId: 'kpi-5', month: 'March', accomplishment: 8, percentage: 40, remarks: 'Excellent progress' },
  
  // KPI-6
  { id: 'acc-16', kpiId: 'kpi-6', month: 'January', accomplishment: 9, percentage: 37.5, remarks: 'Very active' },
  { id: 'acc-17', kpiId: 'kpi-6', month: 'February', accomplishment: 8, percentage: 33.3, remarks: 'Good turnout' },
  { id: 'acc-18', kpiId: 'kpi-6', month: 'March', accomplishment: 10, percentage: 41.7, remarks: 'Exceeded expectations' },
  
  // KPI-7
  { id: 'acc-19', kpiId: 'kpi-7', month: 'January', accomplishment: 3, percentage: 30, remarks: 'Negotiations ongoing' },
  { id: 'acc-20', kpiId: 'kpi-7', month: 'February', accomplishment: 2, percentage: 20, remarks: 'In progress' },
  { id: 'acc-21', kpiId: 'kpi-7', month: 'March', accomplishment: 0, percentage: 0, remarks: 'Pending submission' },
  
  // KPI-8
  { id: 'acc-22', kpiId: 'kpi-8', month: 'January', accomplishment: 6, percentage: 33.3, remarks: 'Well attended' },
  { id: 'acc-23', kpiId: 'kpi-8', month: 'February', accomplishment: 5, percentage: 27.8, remarks: 'Good feedback' },
  { id: 'acc-24', kpiId: 'kpi-8', month: 'March', accomplishment: 7, percentage: 38.9, remarks: 'High engagement' },
  
  // KPI-9
  { id: 'acc-25', kpiId: 'kpi-9', month: 'January', accomplishment: 11, percentage: 36.7, remarks: 'Productive month' },
  { id: 'acc-26', kpiId: 'kpi-9', month: 'February', accomplishment: 10, percentage: 33.3, remarks: 'Quality reports' },
  { id: 'acc-27', kpiId: 'kpi-9', month: 'March', accomplishment: 12, percentage: 40, remarks: 'Outstanding output' },
  
  // KPI-10
  { id: 'acc-28', kpiId: 'kpi-10', month: 'January', accomplishment: 4, percentage: 25, remarks: 'Field work started' },
  { id: 'acc-29', kpiId: 'kpi-10', month: 'February', accomplishment: 3, percentage: 18.75, remarks: 'Weather delays' },
  { id: 'acc-30', kpiId: 'kpi-10', month: 'March', accomplishment: 0, percentage: 0, remarks: 'Team unavailable' },
  
  // KPI-11
  { id: 'acc-31', kpiId: 'kpi-11', month: 'January', accomplishment: 4, percentage: 33.3, remarks: 'Campaign launched' },
  { id: 'acc-32', kpiId: 'kpi-11', month: 'February', accomplishment: 3, percentage: 25, remarks: 'Positive response' },
  { id: 'acc-33', kpiId: 'kpi-11', month: 'March', accomplishment: 4, percentage: 33.3, remarks: 'Good reach' },
  
  // KPI-12
  { id: 'acc-34', kpiId: 'kpi-12', month: 'January', accomplishment: 150, percentage: 30, remarks: 'Training initiated' },
  { id: 'acc-35', kpiId: 'kpi-12', month: 'February', accomplishment: 120, percentage: 24, remarks: 'Continuous learning' },
  { id: 'acc-36', kpiId: 'kpi-12', month: 'March', accomplishment: 0, percentage: 0, remarks: 'No report submitted' }
];

export const issues: Issue[] = [
  {
    id: 'issue-1',
    kpiId: 'kpi-4',
    officeId: 'off-8',
    category: 'Resource Constraint',
    description: 'Insufficient budget allocation for innovation initiatives',
    severity: 'high',
    status: 'open',
    assistanceNeeded: 'Additional budget allocation or reprogramming',
    dateReported: '2026-02-15'
  },
  {
    id: 'issue-2',
    kpiId: 'kpi-10',
    officeId: 'off-5',
    category: 'Personnel',
    description: 'Limited field staff for monitoring missions',
    severity: 'medium',
    status: 'open',
    assistanceNeeded: 'Temporary personnel augmentation',
    dateReported: '2026-03-01'
  },
  {
    id: 'issue-3',
    kpiId: 'kpi-7',
    officeId: 'off-1',
    category: 'Process Delay',
    description: 'Lengthy approval process for partnership agreements',
    severity: 'medium',
    status: 'open',
    assistanceNeeded: 'Streamlined approval workflow',
    dateReported: '2026-02-20'
  },
  {
    id: 'issue-4',
    kpiId: 'kpi-2',
    officeId: 'off-4',
    category: 'Data Availability',
    description: 'Delayed data from partner agencies affecting policy papers',
    severity: 'low',
    status: 'resolved',
    assistanceNeeded: 'Formal data sharing agreements',
    dateReported: '2026-01-10'
  },
  {
    id: 'issue-5',
    kpiId: 'kpi-12',
    officeId: 'off-1',
    category: 'Coordination',
    description: 'Difficulty scheduling training due to conflicting priorities',
    severity: 'low',
    status: 'open',
    assistanceNeeded: 'Training calendar coordination',
    dateReported: '2026-03-05'
  }
];

export const movs: MOV[] = [
  { id: 'mov-1', kpiId: 'kpi-1', month: 'January', fileName: 'strategic_plans_jan.pdf', fileUrl: '#', uploadedBy: 'Juan Cruz', uploadedDate: '2026-02-05', validated: true },
  { id: 'mov-2', kpiId: 'kpi-1', month: 'February', fileName: 'strategic_plans_feb.pdf', fileUrl: '#', uploadedBy: 'Juan Cruz', uploadedDate: '2026-03-05', validated: true },
  { id: 'mov-3', kpiId: 'kpi-1', month: 'March', fileName: 'strategic_plans_mar.pdf', fileUrl: '#', uploadedBy: 'Juan Cruz', uploadedDate: '2026-03-10', validated: true },
  { id: 'mov-4', kpiId: 'kpi-6', month: 'January', fileName: 'consultations_jan.pdf', fileUrl: '#', uploadedBy: 'Elena Mendoza', uploadedDate: '2026-02-03', validated: true },
  { id: 'mov-5', kpiId: 'kpi-6', month: 'February', fileName: 'consultations_feb.pdf', fileUrl: '#', uploadedBy: 'Elena Mendoza', uploadedDate: '2026-03-04', validated: true },
  { id: 'mov-6', kpiId: 'kpi-9', month: 'January', fileName: 'analytics_reports_jan.xlsx', fileUrl: '#', uploadedBy: 'Miguel Torres', uploadedDate: '2026-02-02', validated: true },
  { id: 'mov-7', kpiId: 'kpi-9', month: 'February', fileName: 'analytics_reports_feb.xlsx', fileUrl: '#', uploadedBy: 'Miguel Torres', uploadedDate: '2026-03-03', validated: true },
  { id: 'mov-8', kpiId: 'kpi-9', month: 'March', fileName: 'analytics_reports_mar.xlsx', fileUrl: '#', uploadedBy: 'Miguel Torres', uploadedDate: '2026-03-07', validated: true },
  { id: 'mov-9', kpiId: 'kpi-2', month: 'February', fileName: 'policy_papers_feb.docx', fileUrl: '#', uploadedBy: 'Carlos Ramos', uploadedDate: '2026-03-12', validated: false, validatorNotes: 'Pending review' },
  { id: 'mov-10', kpiId: 'kpi-4', month: 'January', fileName: 'innovation_init_jan.pdf', fileUrl: '#', uploadedBy: 'Roberto Del Rosario', uploadedDate: '2026-03-14', validated: false, validatorNotes: 'Additional documentation needed' }
];
