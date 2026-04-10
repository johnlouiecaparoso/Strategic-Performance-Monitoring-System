import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { AlertCircle, AlertTriangle, Info, CheckCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, PieChart, Pie, Cell } from 'recharts';
import { useAppData } from '../../data/store';
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '../ui/chart';

export function IssuesDashboard() {
  const { issues, kpis, offices } = useAppData();
  const openIssues = issues.filter(i => i.status === 'open');
  const resolvedIssues = issues.filter(i => i.status === 'resolved');
  const highSeverity = issues.filter(i => i.severity === 'high' && i.status === 'open');
  const needingAssistance = issues.filter(i => i.assistanceNeeded && i.status === 'open');

  // Issues by office
  const issuesByOffice = offices.map(office => {
    const officeIssues = issues.filter(i => i.officeId === office.id);
    return {
      office: office.name,
      open: officeIssues.filter(i => i.status === 'open').length,
      resolved: officeIssues.filter(i => i.status === 'resolved').length,
      total: officeIssues.length
    };
  }).filter(o => o.total > 0);

  // Issues by category
  const categoryCount: Record<string, number> = {};
  issues.forEach(issue => {
    categoryCount[issue.category] = (categoryCount[issue.category] || 0) + 1;
  });
  const categoryData = Object.entries(categoryCount).map(([name, value]) => ({ name, value }));

  // Severity distribution
  const severityData = [
    { name: 'High', value: issues.filter(i => i.severity === 'high').length, color: '#ef4444' },
    { name: 'Medium', value: issues.filter(i => i.severity === 'medium').length, color: '#f59e0b' },
    { name: 'Low', value: issues.filter(i => i.severity === 'low').length, color: '#10b981' },
  ];
  const issuesByOfficeChartConfig = {
    open: { label: 'Open', color: '#ef4444' },
    resolved: { label: 'Resolved', color: '#10b981' },
  } satisfies ChartConfig;
  const severityChartConfig = Object.fromEntries(
    severityData.map((entry) => [entry.name, { label: entry.name, color: entry.color }]),
  ) as ChartConfig;
  const formatOfficeLabel = (label: string) =>
    label.length > 18 ? `${label.slice(0, 18)}…` : label;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-3xl font-semibold text-white">Issues &amp; Assistance Dashboard</h1>
        <p className="text-white/80 mt-1 text-sm sm:text-base">Tracking challenges and support requests</p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Issues</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{issues.length}</div>
            <p className="text-xs text-gray-500 mt-1">{openIssues.length} open, {resolvedIssues.length} resolved</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">High Severity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-red-600">{highSeverity.length}</div>
            <p className="text-xs text-gray-500 mt-1">Require immediate attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Need Assistance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-orange-600">{needingAssistance.length}</div>
            <p className="text-xs text-gray-500 mt-1">Management support needed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Resolved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-green-600">{resolvedIssues.length}</div>
            <p className="text-xs text-gray-500 mt-1">
              {issues.length > 0 ? Math.round((resolvedIssues.length / issues.length) * 100) : 0}% resolution rate
            </p>
          </CardContent>
        </Card>
      </div>

      {/* High Severity Issues Alert */}
      {highSeverity.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="size-5 text-red-600" />
              <CardTitle className="text-red-900">High Severity Issues</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="max-h-[26rem] overflow-auto">
            <div className="space-y-3 pr-1">
              {highSeverity.map(issue => {
                const kpi = kpis.find(k => k.id === issue.kpiId);
                const office = offices.find(o => o.id === issue.officeId);
                return (
                  <div key={issue.id} className="p-4 bg-white rounded-lg border border-red-300">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="destructive">{issue.severity}</Badge>
                          <span className="font-medium text-sm">{issue.category}</span>
                        </div>
                        <p className="text-sm text-gray-700 mt-2">{issue.description}</p>
                        <p className="text-xs text-gray-500 mt-2">
                          {office?.name} • {kpi?.code}
                        </p>
                        {issue.assistanceNeeded && (
                          <div className="mt-2 p-2 bg-orange-50 rounded border border-orange-200">
                            <p className="text-xs font-medium text-orange-900">Assistance Needed:</p>
                            <p className="text-xs text-orange-700 mt-1">{issue.assistanceNeeded}</p>
                          </div>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 ml-4">
                        {new Date(issue.dateReported).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Issues by Office</CardTitle>
            <CardDescription>Distribution of issues across offices</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={issuesByOfficeChartConfig}
              exportTitle="Issues by Office"
              exportData={issuesByOffice}
              className="h-[300px] w-full"
            >
              <BarChart data={issuesByOffice}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="office"
                  angle={-45}
                  textAnchor="end"
                  height={100}
                  fontSize={12}
                  tickFormatter={formatOfficeLabel}
                />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <ChartLegend content={<ChartLegendContent />} />
                <Bar dataKey="open" fill="var(--color-open)" name="Open" />
                <Bar dataKey="resolved" fill="var(--color-resolved)" name="Resolved" />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Severity Distribution</CardTitle>
            <CardDescription>Issues by severity level</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={severityChartConfig}
              exportTitle="Severity Distribution"
              exportData={severityData}
              className="h-[300px] w-full !aspect-auto"
            >
              <PieChart>
                <Pie
                  data={severityData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {severityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <ChartTooltip content={<ChartTooltipContent />} />
                <ChartLegend content={<ChartLegendContent />} />
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Issue Categories */}
      <Card>
        <CardHeader>
          <CardTitle>Issue Categories</CardTitle>
          <CardDescription>Breakdown by challenge type</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {categoryData.map(cat => (
              <div key={cat.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="font-medium text-sm">{cat.name}</span>
                <Badge>{cat.value}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* All Issues */}
      <Card>
        <CardHeader>
          <CardTitle>All Issues</CardTitle>
          <CardDescription>Complete list of reported issues and challenges</CardDescription>
        </CardHeader>
        <CardContent className="max-h-[30rem] overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>KPI</TableHead>
                <TableHead>Office</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Assistance</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {issues.map(issue => {
                const kpi = kpis.find(k => k.id === issue.kpiId);
                const office = offices.find(o => o.id === issue.officeId);
                
                return (
                  <TableRow key={issue.id}>
                    <TableCell className="text-xs">
                      {new Date(issue.dateReported).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="font-medium text-sm">{kpi?.code}</TableCell>
                    <TableCell className="text-sm">{office?.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{issue.category}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-xs text-sm">{issue.description}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={
                        issue.severity === 'high' ? 'destructive' :
                        issue.severity === 'medium' ? 'default' :
                        'secondary'
                      }>
                        {issue.severity === 'high' && <AlertCircle className="size-3 mr-1" />}
                        {issue.severity === 'medium' && <AlertTriangle className="size-3 mr-1" />}
                        {issue.severity === 'low' && <Info className="size-3 mr-1" />}
                        {issue.severity}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {issue.assistanceNeeded ? (
                        <div className="max-w-xs text-xs text-gray-700">
                          {issue.assistanceNeeded}
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">None</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={issue.status === 'resolved' ? 'default' : 'outline'}>
                        {issue.status === 'resolved' && <CheckCircle className="size-3 mr-1" />}
                        {issue.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
