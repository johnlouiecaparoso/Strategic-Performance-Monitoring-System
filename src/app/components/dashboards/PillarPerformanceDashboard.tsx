  import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
  import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
  import { Progress } from '../ui/progress';
  import { Badge } from '../ui/badge';
  import { getPillarPerformance } from '../../utils/analytics';
  import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
  import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
    type ChartConfig,
  } from '../ui/chart';

export function PillarPerformanceDashboard() {
  const rows = getPillarPerformance(12);

  const chartData = rows.map((row) => ({
    pillar: row.pillar,
    target: row.target,
    accomplishment: row.accomplishment,
    percent: Number(row.percent.toFixed(1)),
  }));

  const chartConfig = {
    target: {
      label: 'Target',
      color: 'var(--color-chart-1)',
    },
    accomplishment: {
      label: 'Accomplishment',
      color: 'var(--color-chart-2)',
    },
  } satisfies ChartConfig;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-3xl font-semibold text-white">Pillar Performance Dashboard</h1>
        <p className="text-white/80 mt-1 text-sm sm:text-base">Performance monitoring by pillar using quarter targets and accomplishments</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Tracked Pillars</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{rows.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Average Accomplishment</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">
              {rows.length > 0 ? (rows.reduce((sum, row) => sum + row.percent, 0) / rows.length).toFixed(1) : '0.0'}%
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Delayed KPI Rows</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-orange-600">{rows.reduce((sum, row) => sum + row.delayed, 0)}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pillar Target vs Accomplishment</CardTitle>
          <CardDescription>Comparative view of aggregate target and aggregate accomplishment</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={chartConfig}
            exportTitle="Pillar Target vs Accomplishment"
            exportData={chartData}
            className="h-[320px] w-full"
          >
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="pillar" angle={-25} textAnchor="end" height={90} interval={0} />
              <YAxis />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="target" name="Target" fill="var(--color-target)" />
              <Bar dataKey="accomplishment" name="Accomplishment" fill="var(--color-accomplishment)" />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pillar Detail Table</CardTitle>
          <CardDescription>Validation view of KPI count, delayed count, and performance ratio per pillar</CardDescription>
        </CardHeader>
        <CardContent className="max-h-[30rem] overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Pillar</TableHead>
                <TableHead>KPI Count</TableHead>
                <TableHead>Q1 Target</TableHead>
                <TableHead>Q1 Accomplishment</TableHead>
                <TableHead>Completion</TableHead>
                <TableHead>Delayed</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.pillar}>
                  <TableCell className="font-medium">{row.pillar}</TableCell>
                  <TableCell>{row.kpiCount}</TableCell>
                  <TableCell>{row.target.toFixed(2)}</TableCell>
                  <TableCell>{row.accomplishment.toFixed(2)}</TableCell>
                  <TableCell>
                    <div className="min-w-[180px]">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span>{row.percent.toFixed(1)}%</span>
                      </div>
                      <Progress value={Math.min(row.percent, 100)} />
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={row.delayed > 0 ? 'destructive' : 'secondary'}>{row.delayed}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
