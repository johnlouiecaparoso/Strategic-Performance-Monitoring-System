import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { StatusDonutChart } from '../charts/StatusDonutChart';
import { MonthlyTrendChart } from '../charts/MonthlyTrendChart';
import { 
  getSubmissionStats, 
  getStatusBreakdown, 
  getTopPerformingGoals, 
  getOfficesWithMissingSubmissions,
  getMonthlyTrend,
  calculateOverallAccomplishment,
  getDataQualitySummary,
  getPriorityKPIs,
  getKPIDimensionBreakdown,
  getSourceTraceSummary,
} from '../../utils/analytics';
import { Target, CheckCircle, Clock, AlertTriangle, TrendingUp } from 'lucide-react';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { useAppData } from '../../data/store';

export function ExecutiveDashboard() {
  const { kpis, goals, offices } = useAppData();
  const submissionStats = getSubmissionStats();
  const statusBreakdown = getStatusBreakdown();
  const topGoals = getTopPerformingGoals(3);
  const missingOfficeIds = getOfficesWithMissingSubmissions();
  const monthlyTrend = getMonthlyTrend();
  const overallAccomplishment = calculateOverallAccomplishment();
  const quality = getDataQualitySummary();
  const priorityKPIs = getPriorityKPIs(8);
  const pillarBreakdown = getKPIDimensionBreakdown('pillar', 6);
  const assignmentBreakdown = getKPIDimensionBreakdown('assignmentType', 6);
  const perspectiveBreakdown = getKPIDimensionBreakdown('perspective', 6);
  const sourceTrace = getSourceTraceSummary();

  const colors = [
    'var(--color-chart-1)',
    'var(--color-chart-2)',
    'var(--color-chart-3)',
    'var(--color-chart-4)',
    'var(--color-chart-5)',
  ];

  const toDonutData = (rows: Array<{ name: string; count: number }>) =>
    rows.map((row, index) => ({
      name: row.name,
      value: row.count,
      color: colors[index % colors.length],
    }));

  const pillarDonut = toDonutData(pillarBreakdown);
  const assignmentDonut = toDonutData(assignmentBreakdown);
  const perspectiveDonut = toDonutData(perspectiveBreakdown);
  const parseGoalNumber = (name: string) => {
    const match = name.trim().match(/goal\s*(\d+)/i);
    return match ? Number(match[1]) : null;
  };

  const sortedSourceSheets = [...sourceTrace.bySheet].sort((a, b) => {
    const aGoal = parseGoalNumber(a.name);
    const bGoal = parseGoalNumber(b.name);

    if (aGoal !== null && bGoal !== null) return aGoal - bGoal;
    if (aGoal !== null) return -1;
    if (bGoal !== null) return 1;

    return a.name.localeCompare(b.name);
  });

  const sourceDonut = sortedSourceSheets.slice(0, 5).map((row, index) => ({
    name: row.name,
    value: row.count,
    color: colors[index % colors.length],
  }));

  const statusData = [
    { name: 'Completed', value: statusBreakdown.completed, color: '#10b981' },
    { name: 'Ongoing', value: statusBreakdown.ongoing, color: '#3b82f6' },
    { name: 'Delayed', value: statusBreakdown.delayed, color: '#f59e0b' },
    { name: 'Not Started', value: statusBreakdown.notStarted, color: '#ef4444' },
    { name: 'For Validation', value: statusBreakdown.forValidation, color: '#6366f1' },
  ];

  const submissionData = [
    { name: 'Submitted', value: submissionStats.submitted, color: '#10b981' },
    { name: 'Not Submitted', value: submissionStats.notSubmitted, color: '#ef4444' },
    { name: 'Late', value: submissionStats.late, color: '#f59e0b' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-3xl font-semibold text-white">Executive Dashboard</h1>
        <p className="text-white/80 mt-1 text-sm sm:text-base">Overview of organizational KPI performance</p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total KPIs</CardTitle>
            <Target className="size-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{kpis.length}</div>
            <p className="text-xs text-gray-500 mt-1">Active key performance indicators</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Submitted</CardTitle>
            <CheckCircle className="size-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{submissionStats.submitted}</div>
            <p className="text-xs text-gray-500 mt-1">
              {submissionStats.total > 0
                ? `${Math.round((submissionStats.submitted / submissionStats.total) * 100)}% submission rate`
                : '0% submission rate'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Completed</CardTitle>
            <CheckCircle className="size-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{statusBreakdown.completed}</div>
            <p className="text-xs text-gray-500 mt-1">KPIs fully completed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Avg Accomplishment</CardTitle>
            <TrendingUp className="size-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{overallAccomplishment.toFixed(1)}%</div>
            <p className="text-xs text-gray-500 mt-1">Overall performance rate</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Status Distribution</CardTitle>
            <CardDescription>Current status of all KPIs</CardDescription>
          </CardHeader>
          <CardContent>
            <StatusDonutChart data={statusData} exportTitle="Status Distribution" centerLabel="Status" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Submission Status</CardTitle>
            <CardDescription>Submission compliance overview</CardDescription>
          </CardHeader>
          <CardContent>
            <StatusDonutChart data={submissionData} exportTitle="Submission Status" centerLabel="Submissions" />
          </CardContent>
        </Card>
      </div>

      {/* Monthly Trend */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Accomplishment Trend</CardTitle>
          <CardDescription>Progress over the past three months</CardDescription>
        </CardHeader>
        <CardContent>
          <MonthlyTrendChart data={monthlyTrend} exportTitle="Monthly Accomplishment Trend" />
        </CardContent>
      </Card>

      {/* Bottom Row */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Top Performing Goals */}
        <Card>
          <CardHeader>
            <CardTitle>Top Performing Goals</CardTitle>
            <CardDescription>Goals with highest accomplishment rates</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topGoals.map((goalPerf) => {
                const goal = goals.find(g => g.id === goalPerf.goalId);
                return goal ? (
                  <div key={goal.id} className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm break-words">Goal {goal.number}: {goal.name}</p>
                      <Progress value={Math.min(goalPerf.percentage, 100)} className="mt-1 h-2" />
                    </div>
                    <span className="ml-2 font-semibold text-sm whitespace-nowrap">
                      {goalPerf.percentage.toFixed(1)}%
                    </span>
                  </div>
                ) : null;
              })}
            </div>
          </CardContent>
        </Card>

        {/* Offices with Missing Submissions */}
        <Card>
          <CardHeader>
            <CardTitle>Offices with Missing Submissions</CardTitle>
            <CardDescription>Offices that need to submit reports</CardDescription>
          </CardHeader>
          <CardContent>
            {missingOfficeIds.length === 0 ? (
              <div className="flex items-center justify-center py-8 text-gray-500">
                <CheckCircle className="size-5 mr-2 text-green-500" />
                All offices have submitted
              </div>
            ) : (
              <div className="space-y-2 max-h-[24rem] overflow-auto pr-1">
                {missingOfficeIds.map(officeId => {
                  const office = offices.find(o => o.id === officeId);
                  const officeKPIs = kpis.filter(k => k.officeId === officeId && k.submissionStatus === 'not_submitted');
                  return office ? (
                    <div key={office.id} className="flex items-start justify-between gap-3 p-3 bg-red-50 rounded-lg border border-red-200">
                      <div className="min-w-0">
                        <p className="font-medium text-sm break-words">{office.name}</p>
                        <p className="text-xs text-gray-600 break-words">Focal: {office.focalPerson}</p>
                      </div>
                      <Badge variant="destructive" className="whitespace-nowrap">{officeKPIs.length} pending</Badge>
                    </div>
                  ) : null;
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Matrix Dimensions */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Pillar Distribution</CardTitle>
            <CardDescription>How KPIs are spread by pillar</CardDescription>
          </CardHeader>
          <CardContent>
            <StatusDonutChart data={pillarDonut} exportTitle="Pillar Distribution" centerLabel="Pillars" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Assignment Type</CardTitle>
            <CardDescription>Strategic/Core/Support and other assignments</CardDescription>
          </CardHeader>
          <CardContent>
            <StatusDonutChart data={assignmentDonut} exportTitle="Assignment Type" centerLabel="Assignments" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Perspective Mix</CardTitle>
            <CardDescription>Coverage by perspective</CardDescription>
          </CardHeader>
          <CardContent>
            <StatusDonutChart data={perspectiveDonut} exportTitle="Perspective Mix" centerLabel="Perspectives" />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Dimension Performance Snapshot</CardTitle>
          <CardDescription>Average Q1 progress and delayed count by matrix grouping</CardDescription>
        </CardHeader>
        <CardContent className="max-h-[24rem] overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Dimension</TableHead>
                <TableHead>Group</TableHead>
                <TableHead>KPI Count</TableHead>
                <TableHead>Avg Q1 Progress</TableHead>
                <TableHead>Delayed</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[
                ...pillarBreakdown.map((row) => ({ dimension: 'Pillar', ...row })),
                ...assignmentBreakdown.map((row) => ({ dimension: 'Assignment Type', ...row })),
                ...perspectiveBreakdown.map((row) => ({ dimension: 'Perspective', ...row })),
              ].map((row, idx) => (
                <TableRow key={`${row.dimension}-${row.name}-${idx}`}>
                  <TableCell>{row.dimension}</TableCell>
                  <TableCell className="font-medium">{row.name}</TableCell>
                  <TableCell>{row.count}</TableCell>
                  <TableCell>{row.avgProgress.toFixed(1)}%</TableCell>
                  <TableCell>
                    <Badge variant={row.delayed > 0 ? 'destructive' : 'secondary'}>
                      {row.delayed}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Delayed KPIs Alert */}
      {statusBreakdown.delayed > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="size-5 text-orange-600" />
              <CardTitle className="text-orange-900">Delayed KPIs Require Attention</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-orange-800">
              There are <span className="font-semibold">{statusBreakdown.delayed}</span> delayed KPIs that need immediate management intervention.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Data quality summary */}
      <Card>
        <CardHeader>
          <CardTitle>Data Quality Snapshot</CardTitle>
          <CardDescription>Missing or incomplete matrix inputs that can distort reports</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-lg border p-3">
              <div className="text-xs text-gray-500">Missing Q1 Target</div>
              <div className="text-2xl font-semibold">{quality.missingQ1Target}</div>
            </div>
            <div className="rounded-lg border p-3">
              <div className="text-xs text-gray-500">Missing Any Quarter Target</div>
              <div className="text-2xl font-semibold">{quality.missingAnyQuarterTarget}</div>
            </div>
            <div className="rounded-lg border p-3">
              <div className="text-xs text-gray-500">No Monthly Updates</div>
              <div className="text-2xl font-semibold">{quality.noMonthlyUpdates}</div>
            </div>
            <div className="rounded-lg border p-3">
              <div className="text-xs text-gray-500">Missing MOV Text</div>
              <div className="text-2xl font-semibold">{quality.missingMOVText}</div>
            </div>
            <div className="rounded-lg border p-3">
              <div className="text-xs text-gray-500">Missing Focal Person</div>
              <div className="text-2xl font-semibold">{quality.missingFocalPerson}</div>
            </div>
            <div className="rounded-lg border p-3">
              <div className="text-xs text-gray-500">Missing Submission Date</div>
              <div className="text-2xl font-semibold">{quality.missingSubmissionDate}</div>
            </div>
            <div className="rounded-lg border p-3">
              <div className="text-xs text-gray-500">Total KPI Rows</div>
              <div className="text-2xl font-semibold">{quality.total}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Source Traceability</CardTitle>
            <CardDescription>How many KPIs have source sheet and source row mapped</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 grid-cols-3">
              <div className="rounded-lg border p-3">
                <div className="text-xs text-gray-500">Total KPI Rows</div>
                <div className="text-2xl font-semibold">{sourceTrace.total}</div>
              </div>
              <div className="rounded-lg border p-3">
                <div className="text-xs text-gray-500">Traceable</div>
                <div className="text-2xl font-semibold text-green-600">{sourceTrace.traced}</div>
              </div>
              <div className="rounded-lg border p-3">
                <div className="text-xs text-gray-500">Untraced</div>
                <div className="text-2xl font-semibold text-orange-600">{sourceTrace.untraced}</div>
              </div>
            </div>
            <Progress
              className="mt-4"
              value={sourceTrace.total > 0 ? (sourceTrace.traced / sourceTrace.total) * 100 : 0}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Source Sheets</CardTitle>
            <CardDescription>Distribution by source sheet values</CardDescription>
          </CardHeader>
          <CardContent>
            <StatusDonutChart data={sourceDonut} exportTitle="Source Trace Summary" centerLabel="Sources" />
          </CardContent>
        </Card>
      </div>

      {/* Priority KPIs */}
      <Card>
        <CardHeader>
          <CardTitle>Priority KPIs (Needs Improvement)</CardTitle>
          <CardDescription>Top rows that need immediate action based on status, target gap, and open issues</CardDescription>
        </CardHeader>
        <CardContent className="max-h-[28rem] overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>KPI</TableHead>
                <TableHead>Office</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Q1 Progress</TableHead>
                <TableHead>Open Issues</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {priorityKPIs.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <div className="text-xs font-semibold text-gray-600 break-all" title={item.code}>{item.code}</div>
                    <div className="text-sm text-gray-700 max-w-xs break-words leading-snug" title={item.name}>{item.name}</div>
                  </TableCell>
                  <TableCell className="text-sm">{item.officeName}</TableCell>
                  <TableCell>
                    <Badge variant={item.status === 'delayed' ? 'destructive' : 'secondary'}>
                      {item.status.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {item.q1Target > 0 ? `${item.q1Accomplishment.toFixed(2)} / ${item.q1Target.toFixed(2)} (${item.q1Percent.toFixed(1)}%)` : 'No Q1 target'}
                  </TableCell>
                  <TableCell>{item.openIssues}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
