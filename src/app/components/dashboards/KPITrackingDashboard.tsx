import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { TrendingUp, TrendingDown, Minus, AlertCircle } from 'lucide-react';
import { useAppData } from '../../data/store';

export function KPITrackingDashboard() {
  const { kpis, monthlyAccomplishments, goals, offices } = useAppData();
  const kpiData = kpis.map(kpi => {
    const accs = monthlyAccomplishments.filter(a => a.kpiId === kpi.id);
    const totalAcc = accs.reduce((sum, accomplishment) => sum + accomplishment.accomplishment, 0);
    const percentage = kpi.target > 0 ? (totalAcc / kpi.target) * 100 : 0;
    const variance = totalAcc - kpi.target;
    const goal = goals.find(g => g.id === kpi.goalId);
    const office = offices.find(o => o.id === kpi.officeId);

    return {
      ...kpi,
      totalAccomplishment: totalAcc,
      percentage: Math.round(percentage * 10) / 10,
      variance,
      goalName: goal?.name || '',
      officeName: office?.name || '',
      performance:
        percentage >= 100
          ? 'overachieved'
          : percentage >= 80
          ? 'on-track'
          : percentage >= 50
          ? 'at-risk'
          : 'underperforming',
      hasUpdates: accs.length > 0,
    };
  });

  const overachieved = kpiData.filter(k => k.performance === 'overachieved');
  const underperforming = kpiData.filter(k => k.performance === 'underperforming');
  const noUpdates = kpiData.filter(k => !k.hasUpdates);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-3xl font-semibold text-white">KPI Tracking Dashboard</h1>
        <p className="text-white/80 mt-1 text-sm sm:text-base">Target vs accomplishment analysis</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total KPIs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{kpis.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Overachieved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-green-600">{overachieved.length}</div>
            <p className="text-xs text-gray-500 mt-1">≥100% of target</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Underperforming</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-red-600">{underperforming.length}</div>
            <p className="text-xs text-gray-500 mt-1">&lt;50% of target</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">No Updates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-orange-600">{noUpdates.length}</div>
            <p className="text-xs text-gray-500 mt-1">Missing data</p>
          </CardContent>
        </Card>
      </div>

      {overachieved.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="size-5 text-green-600" />
              Overachieved KPIs
            </CardTitle>
            <CardDescription>KPIs that exceeded their targets</CardDescription>
          </CardHeader>
          <CardContent className="max-h-[26rem] overflow-auto">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>KPI</TableHead>
                    <TableHead>Office</TableHead>
                    <TableHead>Target</TableHead>
                    <TableHead>Accomplishment</TableHead>
                    <TableHead>Performance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {overachieved.map(kpi => (
                    <TableRow key={kpi.id}>
                      <TableCell>
                        <div className="font-medium">{kpi.code}</div>
                        <div className="text-xs text-gray-500">{kpi.name}</div>
                      </TableCell>
                      <TableCell className="text-sm">{kpi.officeName}</TableCell>
                      <TableCell>{kpi.target} {kpi.unit}</TableCell>
                      <TableCell>
                        <div className="font-medium text-green-600">
                          {kpi.totalAccomplishment} {kpi.unit}
                        </div>
                        <div className="text-xs text-green-600">+{kpi.variance} {kpi.unit}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress value={Math.min(kpi.percentage, 100)} className="flex-1" />
                          <span className="font-semibold text-sm text-green-600">{kpi.percentage}%</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>All KPIs Performance</CardTitle>
          <CardDescription>Complete target vs accomplishment breakdown</CardDescription>
        </CardHeader>
        <CardContent className="max-h-[30rem] overflow-auto">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>KPI Name</TableHead>
                  <TableHead>Goal</TableHead>
                  <TableHead>Office</TableHead>
                  <TableHead>Target</TableHead>
                  <TableHead>Accomplishment</TableHead>
                  <TableHead>Variance</TableHead>
                  <TableHead>Progress</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {kpiData.map(kpi => (
                  <TableRow key={kpi.id}>
                    <TableCell className="font-medium">{kpi.code}</TableCell>
                    <TableCell>
                      <div className="max-w-xs">
                        <div className="font-medium text-sm">{kpi.name}</div>
                        <div className="text-xs text-gray-500 truncate">{kpi.description}</div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{kpi.goalName}</TableCell>
                    <TableCell className="text-sm">{kpi.officeName}</TableCell>
                    <TableCell>{kpi.target} {kpi.unit}</TableCell>
                    <TableCell>
                      <div
                        className={`font-medium ${
                          kpi.performance === 'overachieved'
                            ? 'text-green-600'
                            : kpi.performance === 'underperforming'
                            ? 'text-red-600'
                            : 'text-blue-600'
                        }`}
                      >
                        {kpi.totalAccomplishment} {kpi.unit}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div
                        className={`flex items-center gap-1 text-sm ${
                          kpi.variance > 0
                            ? 'text-green-600'
                            : kpi.variance < 0
                            ? 'text-red-600'
                            : 'text-gray-600'
                        }`}
                      >
                        {kpi.variance > 0 ? (
                          <TrendingUp className="size-4" />
                        ) : kpi.variance < 0 ? (
                          <TrendingDown className="size-4" />
                        ) : (
                          <Minus className="size-4" />
                        )}
                        {kpi.variance > 0 ? '+' : ''}
                        {kpi.variance} {kpi.unit}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress value={Math.min(kpi.percentage, 100)} className="flex-1" />
                        <span
                          className={`font-semibold text-sm whitespace-nowrap ${
                            kpi.performance === 'overachieved'
                              ? 'text-green-600'
                              : kpi.performance === 'underperforming'
                              ? 'text-red-600'
                              : 'text-blue-600'
                          }`}
                        >
                          {kpi.percentage}%
                        </span>
                      </div>
                      {!kpi.hasUpdates && (
                        <div className="flex items-center gap-1 text-xs text-orange-600 mt-1">
                          <AlertCircle className="size-3" />
                          No updates
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {underperforming.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="size-5 text-red-600" />
              <CardTitle className="text-red-900">Underperforming KPIs Need Immediate Attention</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="max-h-[24rem] overflow-auto">
            <div className="space-y-2 pr-1">
              {underperforming.map(kpi => (
                <div
                  key={kpi.id}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3 bg-white rounded-lg border border-red-200"
                >
                  <div>
                    <p className="font-medium text-sm">{kpi.code}: {kpi.name}</p>
                    <p className="text-xs text-gray-600">{kpi.officeName} • Only {kpi.percentage}% achieved</p>
                  </div>
                  <Badge variant="destructive">Action Required</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
