import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { getMonthlyTrend } from '../../utils/analytics';
import { MonthlyTrendChart } from '../charts/MonthlyTrendChart';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Badge } from '../ui/badge';
import { TrendingUp, TrendingDown, Award, AlertTriangle } from 'lucide-react';
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '../ui/chart';
import { useAppData } from '../../data/store';
import { ALL_MONTHS } from '../../utils/bscGovernance';
import { useMemo } from 'react';

const monthlyDistributionChartConfig = {
  total: {
    label: 'Total Accomplishments',
    color: 'var(--color-chart-1)',
  },
} satisfies ChartConfig;

export function MonthlyDashboard() {
  const { monthlyAccomplishments, kpis, offices } = useAppData();
  const monthlyTrend = getMonthlyTrend();
  const months = useMemo(() => {
    const active = ALL_MONTHS.filter((month) =>
      monthlyAccomplishments.some((row) => row.month === month),
    );
    return active.length > 0 ? active : ALL_MONTHS.slice(0, 3);
  }, [monthlyAccomplishments]);

  const officeMonthHeatmap = useMemo(() => {
    return offices
      .map((office) => {
        const officeKpiIds = new Set(kpis.filter((kpi) => kpi.officeId === office.id).map((kpi) => kpi.id));
        if (officeKpiIds.size === 0) return null;

        const monthlyTotals = months.map((month) => {
          const total = monthlyAccomplishments
            .filter((row) => officeKpiIds.has(row.kpiId) && row.month === month)
            .reduce((sum, row) => sum + row.accomplishment, 0);
          return { month, total };
        });

        return {
          office: office.name,
          monthlyTotals,
          total: monthlyTotals.reduce((sum, row) => sum + row.total, 0),
        };
      })
      .filter((row): row is { office: string; monthlyTotals: Array<{ month: string; total: number }>; total: number } => !!row)
      .sort((a, b) => b.total - a.total);
  }, [kpis, monthlyAccomplishments, offices, months]);

  const heatmapMax = Math.max(
    1,
    ...officeMonthHeatmap.flatMap((row) => row.monthlyTotals.map((item) => item.total)),
  );

  function heatLevelClass(value: number) {
    const ratio = Math.max(0, Math.min(1, value / heatmapMax));
    if (ratio >= 0.85) return 'bg-blue-700 text-white';
    if (ratio >= 0.65) return 'bg-blue-600 text-white';
    if (ratio >= 0.45) return 'bg-blue-500 text-white';
    if (ratio >= 0.25) return 'bg-blue-300 text-slate-900';
    if (ratio > 0) return 'bg-blue-100 text-slate-900';
    return 'bg-slate-100 text-slate-500';
  }
  
  // Calculate best and worst months
  const sortedByTotal = [...monthlyTrend].sort((a, b) => b.total - a.total);
  const bestMonth = sortedByTotal[0];
  const worstMonth = sortedByTotal[sortedByTotal.length - 1];
  
  // Month-over-month comparison
  const monthComparison = monthlyTrend.map((month, idx) => {
    if (idx === 0) return { ...month, change: 0 };
    const prevMonth = monthlyTrend[idx - 1];
    const change = month.total - prevMonth.total;
    const percentChange = prevMonth.total > 0 ? (change / prevMonth.total) * 100 : 0;
    return { ...month, change, percentChange };
  });

  // Accomplishments by month for all KPIs
  const kpiMonthlyData = kpis.map(kpi => {
    const monthValues = months.map((month) => {
      const row = monthlyAccomplishments.find((a) => a.kpiId === kpi.id && a.month === month);
      return {
        month,
        accomplishment: row?.accomplishment || 0,
        percentage: row?.percentage || 0,
      };
    });

    return {
      code: kpi.code,
      name: kpi.name,
      monthValues,
      total: monthValues.reduce((sum, item) => sum + item.accomplishment, 0),
    };
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-3xl font-semibold text-white">Monthly Accomplishment Dashboard</h1>
        <p className="text-white/80 mt-1 text-sm sm:text-base">Track performance trends across months</p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Best Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Award className="size-5 text-yellow-500" />
              <div>
                <div className="text-2xl font-semibold">{bestMonth.month}</div>
                <p className="text-xs text-gray-500 mt-1">{bestMonth.total} total accomplishments</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Weakest Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <AlertTriangle className="size-5 text-orange-500" />
              <div>
                <div className="text-2xl font-semibold">{worstMonth.month}</div>
                <p className="text-xs text-gray-500 mt-1">{worstMonth.total} total accomplishments</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total YTD Accomplishment</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">
              {monthlyTrend.reduce((sum, m) => sum + m.total, 0)}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Avg {Math.round(monthlyTrend.reduce((sum, m) => sum + m.avgPercentage, 0) / (monthlyTrend.length || 1))}% per month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Accomplishment Trend</CardTitle>
          <CardDescription>Total accomplishments and average percentage by month</CardDescription>
        </CardHeader>
        <CardContent>
          <MonthlyTrendChart data={monthlyTrend} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Office x Month Heatmap</CardTitle>
          <CardDescription>Quickly spot high and low accomplishment concentration by office and month</CardDescription>
        </CardHeader>
        <CardContent className="max-h-[28rem] overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Office</TableHead>
                {months.map((month) => (
                  <TableHead key={`heat-${month}`}>{month.slice(0, 3)}</TableHead>
                ))}
                <TableHead>Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {officeMonthHeatmap.map((row) => (
                <TableRow key={row.office}>
                  <TableCell className="font-medium">{row.office}</TableCell>
                  {row.monthlyTotals.map((item) => (
                    <TableCell key={`${row.office}-${item.month}`}>
                      <div
                        className={`rounded px-2 py-1 text-center font-medium ${heatLevelClass(item.total)}`}
                      >
                        {item.total}
                      </div>
                    </TableCell>
                  ))}
                  <TableCell className="font-semibold">{row.total}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Month-over-Month Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Month-over-Month Analysis</CardTitle>
          <CardDescription>Comparison with previous month</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {monthComparison.map((month, idx) => (
              <div key={month.month} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="font-semibold">{month.month}</div>
                  <div className="text-sm text-gray-600 mt-1">
                    {month.total} accomplishments • {month.avgPercentage}% avg completion
                  </div>
                </div>
                {idx > 0 && (
                  <div className={`flex items-center gap-2 ${
                    month.change > 0 ? 'text-green-600' : month.change < 0 ? 'text-red-600' : 'text-gray-600'
                  }`}>
                    {month.change > 0 ? <TrendingUp className="size-5" /> : 
                     month.change < 0 ? <TrendingDown className="size-5" /> : null}
                    <div className="text-right">
                      <div className="font-semibold">
                        {month.change > 0 ? '+' : ''}{month.change}
                      </div>
                      <div className="text-xs">
                        {month.percentChange > 0 ? '+' : ''}{month.percentChange.toFixed(1)}%
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Stacked Monthly Bars */}
      <Card>
        <CardHeader>
          <CardTitle>Accomplishments Distribution</CardTitle>
          <CardDescription>Stacked view of monthly accomplishments by KPI</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={monthlyDistributionChartConfig}
            exportTitle="Accomplishments Distribution"
            exportData={monthlyTrend}
            className="h-[400px] w-full"
          >
            <AreaChart data={monthlyTrend} margin={{ top: 12, right: 8, left: 8, bottom: 4 }}>
              <defs>
                <linearGradient id="fillTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-total)" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="var(--color-total)" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={(value) => Number(value).toLocaleString()}
              />
              <ChartTooltip content={<ChartTooltipContent formatter={(value) => Number(value).toLocaleString()} />} />
              <ChartLegend content={<ChartLegendContent />} />
              <Area
                type="monotone"
                dataKey="total"
                stroke="var(--color-total)"
                fill="url(#fillTotal)"
                strokeWidth={2.5}
              />
            </AreaChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Detailed Monthly Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>KPI Monthly Breakdown</CardTitle>
          <CardDescription>Accomplishments per KPI by month</CardDescription>
        </CardHeader>
        <CardContent className="max-h-[30rem] overflow-auto">
          <Table className="table-fixed min-w-[2200px]">
            <TableHeader>
              <TableRow>
                <TableHead className="w-[220px]">KPI Code</TableHead>
                <TableHead className="w-[460px]">KPI Name</TableHead>
                {months.map((month) => (
                  <TableHead key={`header-${month}`}>{month.slice(0, 3)}</TableHead>
                ))}
                <TableHead>YTD Total</TableHead>
                <TableHead>Trend</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {kpiMonthlyData.map(kpi => {
                const tail = kpi.monthValues.slice(-3);
                const [m1, m2, m3] = tail;
                const trend = m3 && m2 && m1 && m3.accomplishment > m2.accomplishment && m2.accomplishment > m1.accomplishment
                  ? 'improving'
                  : m3 && m2 && m1 && m3.accomplishment < m2.accomplishment && m2.accomplishment < m1.accomplishment
                  ? 'declining'
                  : 'stable';
                
                return (
                  <TableRow key={kpi.code}>
                    <TableCell className="w-[220px] text-xs font-semibold text-gray-600 align-top">
                      <div className="w-[220px] whitespace-normal break-all leading-snug" title={kpi.code}>{kpi.code}</div>
                    </TableCell>
                    <TableCell>
                      <div className="w-[460px] max-w-[460px] break-words text-base font-semibold leading-tight">{kpi.name}</div>
                    </TableCell>
                    {kpi.monthValues.map((item) => (
                      <TableCell key={`${kpi.code}-${item.month}`}>
                        <div>
                          <div className="font-medium">{item.accomplishment}</div>
                          <div className="text-xs text-gray-500">{item.percentage}%</div>
                        </div>
                      </TableCell>
                    ))}
                    <TableCell className="font-semibold">{kpi.total}</TableCell>
                    <TableCell>
                      <Badge variant={
                        trend === 'improving' ? 'default' :
                        trend === 'declining' ? 'destructive' :
                        'secondary'
                      }>
                        {trend === 'improving' && <TrendingUp className="size-3 mr-1" />}
                        {trend === 'declining' && <TrendingDown className="size-3 mr-1" />}
                        {trend}
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
