// Type definitions for the Strategic Foresight and Management System

export type UserRole = 'admin' | 'encoder' | 'validator' | 'executive';

export type KPIStatus = 'completed' | 'ongoing' | 'delayed' | 'not_started' | 'for_validation';

export type SubmissionStatus = 'submitted' | 'not_submitted' | 'late';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  office: string;
}

export interface Office {
  id: string;
  name: string;
  code: string;
  focalPerson: string;
}

export interface Goal {
  id: string;
  number: number;
  name: string;
  description: string;
}

export interface KPI {
  id: string;
  code: string;
  name: string;
  description: string;
  goalId: string;
  officeId: string;
  target: number;
  unit: string;
  status: KPIStatus;
  submissionStatus: SubmissionStatus;
  submissionDate?: string;
  focalPerson: string;
  pillar?: string;
  assignmentType?: string;
  perspective?: string;
  strategicObjective?: string;
  q1Target?: number;
  targetText?: string;
  keyActivitiesOutputs?: string;
  movText?: string;
  bscRemarks?: string;
  sourceSheet?: string;
  sourceRow?: number;
}

export interface MonthlyAccomplishment {
  id: string;
  kpiId: string;
  month: 'January' | 'February' | 'March' | 'April' | 'May' | 'June' | 'July' | 'August' | 'September' | 'October' | 'November' | 'December';
  accomplishment: number;
  percentage: number;
  remarks?: string;
}

export interface Issue {
  id: string;
  kpiId: string;
  officeId: string;
  category: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
  status: 'open' | 'resolved';
  assistanceNeeded?: string;
  dateReported: string;
}

export interface MOV {
  id: string;
  kpiId: string;
  month: string;
  fileName: string;
  fileUrl: string;
  uploadedBy: string;
  uploadedDate: string;
  validated: boolean;
  validatorNotes?: string;
}

export interface Validation {
  id: string;
  kpiId: string;
  validatorId: string;
  status: 'pending' | 'approved' | 'rejected';
  notes: string;
  date: string;
}
