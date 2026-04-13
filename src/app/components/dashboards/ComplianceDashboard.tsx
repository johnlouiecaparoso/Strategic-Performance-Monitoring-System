import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { getOfficeCompliance } from '../../utils/analytics';
import { Badge } from '../ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Progress } from '../ui/progress';
import { CheckCircle, XCircle, Clock, Calendar } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { useAppData } from '../../data/store';
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '../ui/chart';

export function ComplianceDashboard() {
  const { kpis, offices } = useAppData();
  const submitted = kpis.filter(k => k.submissionStatus === 'submitted').length;
  const notSubmitted = kpis.filter(k => k.submissionStatus === 'not_submitted').length;
  const late = kpis.filter(k => k.submissionStatus === 'late').length;
  const totalSubmittedAny = submitted + late;
  const totalCompliance = kpis.length > 0 ? (totalSubmittedAny / kpis.length) * 100 : 0;

  // Compliance by office
  const officeComplianceData = offices.map(office => {
    const compliance = getOfficeCompliance(office.id);
    return {
      office: office.name,
      compliance: compliance.compliance,
      submitted: compliance.submitted,
      late: compliance.late,
      compliant: compliance.compliant,
      total: compliance.total
    };
  }).filter(o => o.total > 0);

  // On-time vs late submissions
  const onTime = kpis.filter(k => k.submissionStatus === 'submitted' && k.submissionDate);
  const lateSubmissions = kpis.filter(k => k.submissionStatus === 'late');
  const submissionFunnelData = [
    { stage: 'Total KPIs', value: kpis.length },
    { stage: 'Any Submitted', value: totalSubmittedAny },
    { stage: 'On Time Submitted', value: submitted },
    { stage: 'Late Submitted', value: late },
    { stage: 'Not Submitted', value: notSubmitted },
  ];
  const formatOfficeLabel = (label: string) =>
    label.length > 18 ? `${label.slice(0, 18)}…` : label;
  const officeComplianceChartConfig = {
    compliance: { label: 'Compliance %', color: '#3b82f6' },
  } satisfies ChartConfig;
  const funnelChartConfig = {
    value: { label: 'Count', color: '#2563eb' },
  } satisfies ChartConfig;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-3xl font-semibold text-white">Submission Compliance Dashboard</h1>
        <p className="text-white/80 mt-1 text-sm sm:text-base">Track submission status and compliance rates</p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Overall Compliance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{totalCompliance.toFixed(1)}%</div>
            <Progress value={totalCompliance} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Submitted</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-green-600">{submitted}</div>
            <p className="text-xs text-gray-500 mt-1">On time and complete</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Late Submissions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-orange-600">{late}</div>
            <p className="text-xs text-gray-500 mt-1">Submitted after deadline</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Not Submitted</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-red-600">{notSubmitted}</div>
            <p className="text-xs text-gray-500 mt-1">Pending submission</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Submission Funnel</CardTitle>
          <CardDescription>Submission conversion from total KPI rows to on-time and late submissions</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={funnelChartConfig}
            exportTitle="Submission Funnel"
            exportData={submissionFunnelData}
            className="h-[320px] w-full"
          >
            <BarChart data={submissionFunnelData} layout="vertical" margin={{ top: 12, right: 8, left: 24, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" tickLine={false} axisLine={false} />
              <YAxis type="category" dataKey="stage" width={130} tickLine={false} axisLine={false} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="value" fill="var(--color-value)" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Office Compliance Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Compliance by Office</CardTitle>
          <CardDescription>Submission compliance rate per office</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={officeComplianceChartConfig}
            exportTitle="Compliance by Office"
            exportData={officeComplianceData}
            className="h-[350px] w-full"
          >
            <BarChart data={officeComplianceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="office"
                angle={-45}
                textAnchor="end"
                height={120}
                fontSize={12}
                tickFormatter={formatOfficeLabel}
              />
              <YAxis domain={[0, 100]} />
              <ChartTooltip content={<ChartTooltipContent formatter={(value) => `${Number(value).toFixed(1)}%`} />} />
              <ChartLegend content={<ChartLegendContent />} />
              <Bar dataKey="compliance" fill="var(--color-compliance)" name="Compliance %" />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Not Submitted Alert */}
      {notSubmitted > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <XCircle className="size-5 text-red-600" />
              <CardTitle className="text-red-900">Missing Submissions</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="max-h-[26rem] overflow-auto">
            <Table className="table-fixed min-w-[1200px]">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[220px]">KPI Code</TableHead>
                  <TableHead className="w-[460px]">KPI Name</TableHead>
                  <TableHead>Office</TableHead>
                  <TableHead>Focal Person</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {kpis.filter(k => k.submissionStatus === 'not_submitted').map(kpi => {
                  const office = offices.find(o => o.id === kpi.officeId);
                  return (
                    <TableRow key={kpi.id}>
                      <TableCell className="w-[220px] text-xs font-semibold text-gray-600 align-top">
                        <div className="w-[220px] whitespace-normal break-all leading-snug" title={kpi.code}>{kpi.code}</div>
                      </TableCell>
                      <TableCell className="w-[460px] text-base font-semibold leading-tight">{kpi.name}</TableCell>
                      <TableCell>{office?.name}</TableCell>
                      <TableCell>{kpi.focalPerson}</TableCell>
                      <TableCell>
                        <Badge variant="destructive">Not Submitted</Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Late Submissions */}
      {late > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Clock className="size-5 text-orange-600" />
              <CardTitle className="text-orange-900">Late Submissions</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="max-h-[26rem] overflow-auto">
            <Table className="table-fixed min-w-[1200px]">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[220px]">KPI Code</TableHead>
                  <TableHead className="w-[460px]">KPI Name</TableHead>
                  <TableHead>Office</TableHead>
                  <TableHead>Focal Person</TableHead>
                  <TableHead>Submission Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {kpis.filter(k => k.submissionStatus === 'late').map(kpi => {
                  const office = offices.find(o => o.id === kpi.officeId);
                  return (
                    <TableRow key={kpi.id}>
                      <TableCell className="w-[220px] text-xs font-semibold text-gray-600 align-top">
                        <div className="w-[220px] whitespace-normal break-all leading-snug" title={kpi.code}>{kpi.code}</div>
                      </TableCell>
                      <TableCell className="w-[460px] text-base font-semibold leading-tight">{kpi.name}</TableCell>
                      <TableCell>{office?.name}</TableCell>
                      <TableCell>{kpi.focalPerson}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="size-4 text-orange-600" />
                          {kpi.submissionDate ? new Date(kpi.submissionDate).toLocaleDateString() : 'N/A'}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* All Submissions */}
      <Card>
        <CardHeader>
          <CardTitle>All Submission Records</CardTitle>
          <CardDescription>Complete submission tracking</CardDescription>
        </CardHeader>
        <CardContent className="max-h-[30rem] overflow-auto">
          <Table className="table-fixed min-w-[1300px]">
            <TableHeader>
              <TableRow>
                <TableHead className="w-[220px]">KPI Code</TableHead>
                <TableHead className="w-[460px]">KPI Name</TableHead>
                <TableHead>Office</TableHead>
                <TableHead>Focal Person</TableHead>
                <TableHead>Submission Date</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {kpis.map(kpi => {
                const office = offices.find(o => o.id === kpi.officeId);
                return (
                  <TableRow key={kpi.id}>
                    <TableCell className="w-[220px] text-xs font-semibold text-gray-600 align-top">
                      <div className="w-[220px] whitespace-normal break-all leading-snug" title={kpi.code}>{kpi.code}</div>
                    </TableCell>
                    <TableCell>
                      <div className="w-[460px] max-w-[460px]">
                        <div className="font-semibold text-base leading-tight">{kpi.name}</div>
                        <div className="text-xs text-gray-500 truncate">{kpi.description}</div>
                      </div>
                    </TableCell>
                    <TableCell>{office?.name}</TableCell>
                    <TableCell>{kpi.focalPerson}</TableCell>
                    <TableCell>
                      {kpi.submissionDate ? (
                        <div className="flex items-center gap-2">
                          <Calendar className="size-4 text-gray-400" />
                          <span className="text-sm">{new Date(kpi.submissionDate).toLocaleDateString()}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">Not submitted</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={
                        kpi.submissionStatus === 'submitted' ? 'default' :
                        kpi.submissionStatus === 'late' ? 'secondary' :
                        'destructive'
                      }>
                        {kpi.submissionStatus === 'submitted' && <CheckCircle className="size-3 mr-1" />}
                        {kpi.submissionStatus === 'late' && <Clock className="size-3 mr-1" />}
                        {kpi.submissionStatus === 'not_submitted' && <XCircle className="size-3 mr-1" />}
                        {kpi.submissionStatus.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Office Compliance Details */}
      <Card>
        <CardHeader>
          <CardTitle>Office Compliance Details</CardTitle>
          <CardDescription>Detailed compliance metrics by office</CardDescription>
        </CardHeader>
        <CardContent className="max-h-[18rem] overflow-auto">
          <div className="space-y-4 pr-1">
            {officeComplianceData
              .sort((a, b) => b.compliance - a.compliance)
              .map((data, idx) => (
                <div key={idx} className="flex items-center gap-4">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-sm">{data.office}</span>
                      <span className="text-sm text-gray-600">
                        {data.submitted} / {data.total} submitted
                      </span>
                    </div>
                    <Progress value={data.compliance} />
                  </div>
                  <div className="font-semibold text-lg w-16 text-right">
                    {data.compliance.toFixed(0)}%
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
