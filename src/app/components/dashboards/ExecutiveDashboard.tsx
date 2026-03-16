import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { StatusDonutChart } from '../charts/StatusDonutChart';
import { MonthlyTrendChart } from '../charts/MonthlyTrendChart';
import { 
  getSubmissionStats, 
  getStatusBreakdown, 
  getTopPerformingGoals, 
  getOfficesWithMissingSubmissions,
  getMonthlyTrend,
  calculateOverallAccomplishment 
} from '../../utils/analytics';
import { Target, CheckCircle, Clock, AlertTriangle, TrendingUp } from 'lucide-react';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { useAppData } from '../../data/store';

export function ExecutiveDashboard() {
  const { kpis, goals, offices } = useAppData();
  const submissionStats = getSubmissionStats();
  const statusBreakdown = getStatusBreakdown();
  const topGoals = getTopPerformingGoals(3);
  const missingOfficeIds = getOfficesWithMissingSubmissions();
  const monthlyTrend = getMonthlyTrend();
  const overallAccomplishment = calculateOverallAccomplishment();

  const statusData = [
    { name: 'Completed', value: statusBreakdown.completed, color: '#10b981' },
    { name: 'Ongoing', value: statusBreakdown.ongoing, color: '#3b82f6' },
    { name: 'Delayed', value: statusBreakdown.delayed, color: '#f59e0b' },
    { name: 'Not Started', value: statusBreakdown.notStarted, color: '#ef4444' },
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
              {Math.round((submissionStats.submitted / submissionStats.total) * 100)}% submission rate
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
            <StatusDonutChart data={statusData} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Submission Status</CardTitle>
            <CardDescription>Submission compliance overview</CardDescription>
          </CardHeader>
          <CardContent>
            <StatusDonutChart data={submissionData} />
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
          <MonthlyTrendChart data={monthlyTrend} />
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
    </div>
  );
}
