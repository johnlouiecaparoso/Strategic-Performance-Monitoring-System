// Analytics and calculation utilities

import { KPI, MonthlyAccomplishment, Issue, MOV } from '../types';
import { getDataSnapshot } from '../data/store';

export function calculateOverallAccomplishment(): number {
  const { kpis, monthlyAccomplishments } = getDataSnapshot();
  const totalTarget = kpis.reduce((sum, kpi) => sum + kpi.target, 0);
  const totalAccomplishment = monthlyAccomplishments.reduce((sum, acc) => sum + acc.accomplishment, 0);
  return totalTarget > 0 ? (totalAccomplishment / totalTarget) * 100 : 0;
}

export function getSubmissionStats() {
  const { kpis } = getDataSnapshot();
  const submitted = kpis.filter(k => k.submissionStatus === 'submitted').length;
  const notSubmitted = kpis.filter(k => k.submissionStatus === 'not_submitted').length;
  const late = kpis.filter(k => k.submissionStatus === 'late').length;
  
  return { submitted, notSubmitted, late, total: kpis.length };
}

export function getStatusBreakdown() {
  const { kpis } = getDataSnapshot();
  const completed = kpis.filter(k => k.status === 'completed').length;
  const ongoing = kpis.filter(k => k.status === 'ongoing').length;
  const delayed = kpis.filter(k => k.status === 'delayed').length;
  const notStarted = kpis.filter(k => k.status === 'not_started').length;
  
  return { completed, ongoing, delayed, notStarted };
}

export function getTopPerformingGoals(limit: number = 3) {
  const { kpis, monthlyAccomplishments } = getDataSnapshot();
  const goalPerformance = new Map<string, { total: number, accomplished: number }>();
  
  kpis.forEach(kpi => {
    if (!goalPerformance.has(kpi.goalId)) {
      goalPerformance.set(kpi.goalId, { total: 0, accomplished: 0 });
    }
    const perf = goalPerformance.get(kpi.goalId)!;
    perf.total += kpi.target;
    
    const kpiAccomplishments = monthlyAccomplishments.filter(a => a.kpiId === kpi.id);
    const accomplished = kpiAccomplishments.reduce((sum, a) => sum + a.accomplishment, 0);
    perf.accomplished += accomplished;
  });
  
  return Array.from(goalPerformance.entries())
    .map(([goalId, perf]) => ({
      goalId,
      percentage: perf.total > 0 ? (perf.accomplished / perf.total) * 100 : 0
    }))
    .sort((a, b) => b.percentage - a.percentage)
    .slice(0, limit);
}

export function getOfficesWithMissingSubmissions() {
  const { kpis } = getDataSnapshot();
  return kpis
    .filter(k => k.submissionStatus === 'not_submitted')
    .map(k => k.officeId)
    .filter((value, index, self) => self.indexOf(value) === index);
}

export function getMonthlyTrend() {
  const { monthlyAccomplishments } = getDataSnapshot();
  const months = ['January', 'February', 'March'];
  return months.map(month => {
    const monthAccomplishments = monthlyAccomplishments.filter(a => a.month === month);
    const total = monthAccomplishments.reduce((sum, a) => sum + a.accomplishment, 0);
    const avgPercentage = monthAccomplishments.length > 0
      ? monthAccomplishments.reduce((sum, a) => sum + a.percentage, 0) / monthAccomplishments.length
      : 0;
    
    return {
      month,
      total,
      avgPercentage: Math.round(avgPercentage * 10) / 10
    };
  });
}

export function getKPIsByGoal(goalId: string) {
  const { kpis } = getDataSnapshot();
  return kpis.filter(k => k.goalId === goalId);
}

export function getAccomplishmentsByKPI(kpiId: string) {
  const { monthlyAccomplishments } = getDataSnapshot();
  return monthlyAccomplishments.filter(a => a.kpiId === kpiId);
}

export function getIssuesByOffice(officeId: string) {
  const { issues } = getDataSnapshot();
  return issues.filter(i => i.officeId === officeId);
}

export function getMOVByKPI(kpiId: string) {
  const { movs } = getDataSnapshot();
  return movs.filter(m => m.kpiId === kpiId);
}

export function getOfficeCompliance(officeId: string) {
  const { kpis } = getDataSnapshot();
  const officeKPIs = kpis.filter(k => k.officeId === officeId);
  const submitted = officeKPIs.filter(k => k.submissionStatus === 'submitted').length;
  
  return {
    total: officeKPIs.length,
    submitted,
    compliance: officeKPIs.length > 0 ? (submitted / officeKPIs.length) * 100 : 0
  };
}

export function getMOVCompleteness() {
  const { kpis, movs } = getDataSnapshot();
  const totalKPIs = kpis.length;
  const kpisWithMOV = [...new Set(movs.map(m => m.kpiId))].length;
  const validatedMOVs = movs.filter(m => m.validated).length;
  
  return {
    totalKPIs,
    kpisWithMOV,
    totalMOVs: movs.length,
    validatedMOVs,
    percentage: totalKPIs > 0 ? (kpisWithMOV / totalKPIs) * 100 : 0
  };
}
