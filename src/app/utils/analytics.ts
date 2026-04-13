// Analytics and calculation utilities

import { KPI, MonthlyAccomplishment, Issue, MOV, QuarterName } from '../types';
import { getDataSnapshot } from '../data/store';
import { ALL_MONTHS, QUARTER_MONTHS } from './bscGovernance';

export function getKPIBenchmarkTarget(kpi: KPI): number {
  return kpi.q1Target && kpi.q1Target > 0 ? kpi.q1Target : kpi.target;
}

export function getKPIQuarterTarget(kpi: KPI, quarter: QuarterName): number {
  if (quarter === 'Q1') return kpi.q1Target && kpi.q1Target > 0 ? kpi.q1Target : kpi.target;
  if (quarter === 'Q2') return kpi.q2Target && kpi.q2Target > 0 ? kpi.q2Target : 0;
  if (quarter === 'Q3') return kpi.q3Target && kpi.q3Target > 0 ? kpi.q3Target : 0;
  if (quarter === 'Q4') return kpi.q4Target && kpi.q4Target > 0 ? kpi.q4Target : 0;
  return 0;
}

export function getKPIQ1Accomplishment(kpiId: string): number {
  return getKPIQuarterAccomplishment(kpiId, 'Q1');
}

export function getKPIQuarterAccomplishment(kpiId: string, quarter: QuarterName): number {
  const { monthlyAccomplishments } = getDataSnapshot();
  const quarterMonths = QUARTER_MONTHS[quarter];
  return monthlyAccomplishments
    .filter((acc) => acc.kpiId === kpiId && quarterMonths.includes(acc.month))
    .reduce((sum, acc) => sum + acc.accomplishment, 0);
}

export function getKPIQ1Progress(kpi: KPI) {
  return getKPIQuarterProgress(kpi, 'Q1');
}

export function getKPIQuarterProgress(kpi: KPI, quarter: QuarterName) {
  const accomplishment = getKPIQuarterAccomplishment(kpi.id, quarter);
  const benchmarkTarget = getKPIQuarterTarget(kpi, quarter);
  const percentage = benchmarkTarget > 0 ? (accomplishment / benchmarkTarget) * 100 : 0;

  return {
    accomplishment,
    benchmarkTarget,
    percentage,
  };
}

export function calculateOverallAccomplishment(): number {
  const { kpis } = getDataSnapshot();
  const totalTarget = kpis.reduce((sum, kpi) => sum + getKPIBenchmarkTarget(kpi), 0);
  const totalAccomplishment = kpis.reduce((sum, kpi) => sum + getKPIQ1Accomplishment(kpi.id), 0);
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
  const forValidation = kpis.filter(k => k.status === 'for_validation').length;
  
  return { completed, ongoing, delayed, notStarted, forValidation };
}

export function getTopPerformingGoals(limit: number = 3) {
  const { kpis } = getDataSnapshot();
  const goalPerformance = new Map<string, { total: number, accomplished: number }>();
  
  kpis.forEach(kpi => {
    if (!goalPerformance.has(kpi.goalId)) {
      goalPerformance.set(kpi.goalId, { total: 0, accomplished: 0 });
    }
    const perf = goalPerformance.get(kpi.goalId)!;
    perf.total += getKPIBenchmarkTarget(kpi);
    perf.accomplished += getKPIQ1Accomplishment(kpi.id);
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
  const monthsWithData = ALL_MONTHS.filter((month) =>
    monthlyAccomplishments.some((a) => a.month === month),
  );
  const months = monthsWithData.length > 0 ? monthsWithData : ALL_MONTHS.slice(0, 3);

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
  const late = officeKPIs.filter(k => k.submissionStatus === 'late').length;
  const compliant = submitted + late;
  
  return {
    total: officeKPIs.length,
    submitted,
    late,
    compliant,
    compliance: officeKPIs.length > 0 ? (compliant / officeKPIs.length) * 100 : 0
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

export function getDataQualitySummary() {
  const { kpis, monthlyAccomplishments } = getDataSnapshot();

  const missingQ1Target = kpis.filter((kpi) => !kpi.q1Target || kpi.q1Target <= 0).length;
  const missingAnyQuarterTarget = kpis.filter(
    (kpi) =>
      (!kpi.q1Target || kpi.q1Target <= 0) ||
      (!kpi.q2Target || kpi.q2Target <= 0) ||
      (!kpi.q3Target || kpi.q3Target <= 0) ||
      (!kpi.q4Target || kpi.q4Target <= 0),
  ).length;
  const missingFocalPerson = kpis.filter((kpi) => !kpi.focalPerson?.trim()).length;
  const missingSubmissionDate = kpis.filter((kpi) => !kpi.submissionDate).length;
  const missingMOVText = kpis.filter((kpi) => !kpi.movText?.trim() && !kpi.meansOfVerification?.trim()).length;

  const noMonthlyUpdates = kpis.filter((kpi) => {
    const rows = monthlyAccomplishments.filter((acc) => acc.kpiId === kpi.id);
    return rows.length === 0 || rows.every((acc) => !acc.accomplishment || acc.accomplishment <= 0);
  }).length;

  return {
    total: kpis.length,
    missingQ1Target,
    missingAnyQuarterTarget,
    missingFocalPerson,
    missingSubmissionDate,
    missingMOVText,
    noMonthlyUpdates,
  };
}

export function getPriorityKPIs(limit: number = 8) {
  const { kpis, issues, offices } = getDataSnapshot();

  return kpis
    .map((kpi) => {
      const q1Accomplishment = getKPIQ1Accomplishment(kpi.id);
      const q1Target = getKPIBenchmarkTarget(kpi);
      const q1Percent = q1Target > 0 ? (q1Accomplishment / q1Target) * 100 : 0;
      const openIssues = issues.filter((issue) => issue.kpiId === kpi.id && issue.status === 'open').length;
      const officeName = offices.find((office) => office.id === kpi.officeId)?.name || kpi.officeId;

      let score = 0;
      if (kpi.status === 'delayed') score += 50;
      if (kpi.status === 'not_started') score += 30;
      if (kpi.status === 'for_validation') score += 20;
      if (q1Target > 0 && q1Percent < 50) score += 30;
      if (q1Target > 0 && q1Percent < 80) score += 10;
      score += openIssues * 10;
      if (!kpi.movText && !kpi.meansOfVerification) score += 5;

      return {
        id: kpi.id,
        code: kpi.code,
        name: kpi.name,
        officeName,
        status: kpi.status,
        q1Target,
        q1Accomplishment,
        q1Percent,
        openIssues,
        score,
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

export function getPillarPerformance(limit = 10) {
  const { kpis } = getDataSnapshot();
  const grouped = new Map<string, { target: number; accomplishment: number; kpiCount: number; delayed: number }>();

  kpis.forEach((kpi) => {
    const pillar = kpi.pillar?.trim() || 'Unspecified';
    const q1 = getKPIQuarterProgress(kpi, 'Q1');

    if (!grouped.has(pillar)) {
      grouped.set(pillar, { target: 0, accomplishment: 0, kpiCount: 0, delayed: 0 });
    }

    const row = grouped.get(pillar)!;
    row.target += q1.benchmarkTarget;
    row.accomplishment += q1.accomplishment;
    row.kpiCount += 1;
    if (kpi.status === 'delayed') row.delayed += 1;
  });

  return Array.from(grouped.entries())
    .map(([pillar, row]) => ({
      pillar,
      target: row.target,
      accomplishment: row.accomplishment,
      kpiCount: row.kpiCount,
      delayed: row.delayed,
      percent: row.target > 0 ? (row.accomplishment / row.target) * 100 : 0,
    }))
    .sort((a, b) => b.percent - a.percent)
    .slice(0, limit);
}

export function getKPIDimensionBreakdown(
  dimension: 'pillar' | 'assignmentType' | 'perspective',
  limit: number = 8,
) {
  const { kpis } = getDataSnapshot();
  const grouped = new Map<string, { count: number; totalPercent: number; delayed: number }>();

  kpis.forEach((kpi) => {
    const keyRaw =
      dimension === 'pillar'
        ? kpi.pillar
        : dimension === 'assignmentType'
        ? kpi.assignmentType
        : kpi.perspective;

    const key = keyRaw && keyRaw.trim() ? keyRaw.trim() : 'Unspecified';
    const progress = getKPIQ1Progress(kpi);

    if (!grouped.has(key)) {
      grouped.set(key, { count: 0, totalPercent: 0, delayed: 0 });
    }

    const current = grouped.get(key)!;
    current.count += 1;
    current.totalPercent += progress.percentage;
    if (kpi.status === 'delayed') current.delayed += 1;
  });

  return Array.from(grouped.entries())
    .map(([name, value]) => ({
      name,
      count: value.count,
      delayed: value.delayed,
      avgProgress: value.count > 0 ? Number((value.totalPercent / value.count).toFixed(1)) : 0,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

export function getSourceTraceSummary() {
  const { kpis } = getDataSnapshot();
  const traced = kpis.filter((kpi) => kpi.sourceSheet && typeof kpi.sourceRow === 'number').length;
  const bySheet = new Map<string, number>();

  kpis.forEach((kpi) => {
    const key = kpi.sourceSheet?.trim() || 'Unknown source';
    bySheet.set(key, (bySheet.get(key) || 0) + 1);
  });

  return {
    total: kpis.length,
    traced,
    untraced: Math.max(0, kpis.length - traced),
    bySheet: Array.from(bySheet.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count),
  };
}
