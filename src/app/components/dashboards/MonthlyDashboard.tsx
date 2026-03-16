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

const monthlyDistributionChartConfig = {
  total: {
    label: 'Total Accomplishments',
    color: 'var(--color-chart-1)',
  },
} satisfies ChartConfig;

export function MonthlyDashboard() {
  const { monthlyAccomplishments, kpis } = useAppData();
  const monthlyTrend = getMonthlyTrend();
  
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
    const jan = monthlyAccomplishments.find(a => a.kpiId === kpi.id && a.month === 'January');
    const feb = monthlyAccomplishments.find(a => a.kpiId === kpi.id && a.month === 'February');
    const mar = monthlyAccomplishments.find(a => a.kpiId === kpi.id && a.month === 'March');
    
    return {
      code: kpi.code,
      name: kpi.name,
      january: jan?.accomplishment || 0,
      february: feb?.accomplishment || 0,
      march: mar?.accomplishment || 0,
      total: (jan?.accomplishment || 0) + (feb?.accomplishment || 0) + (mar?.accomplishment || 0),
      janPercent: jan?.percentage || 0,
      febPercent: feb?.percentage || 0,
      marPercent: mar?.percentage || 0
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
            <CardTitle className="text-sm font-medium text-gray-600">Total Q1 Accomplishment</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">
              {monthlyTrend.reduce((sum, m) => sum + m.total, 0)}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Avg {Math.round(monthlyTrend.reduce((sum, m) => sum + m.avgPercentage, 0) / monthlyTrend.length)}% per month
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
          <ChartContainer config={monthlyDistributionChartConfig} className="h-[400px] w-full">
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>KPI Code</TableHead>
                <TableHead>KPI Name</TableHead>
                <TableHead>January</TableHead>
                <TableHead>February</TableHead>
                <TableHead>March</TableHead>
                <TableHead>Q1 Total</TableHead>
                <TableHead>Trend</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {kpiMonthlyData.map(kpi => {
                const trend = kpi.march > kpi.february && kpi.february > kpi.january ? 'improving' :
                              kpi.march < kpi.february && kpi.february < kpi.january ? 'declining' :
                              'stable';
                
                return (
                  <TableRow key={kpi.code}>
                    <TableCell className="font-medium">{kpi.code}</TableCell>
                    <TableCell>
                      <div className="max-w-xs break-words">{kpi.name}</div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{kpi.january}</div>
                        <div className="text-xs text-gray-500">{kpi.janPercent}%</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{kpi.february}</div>
                        <div className="text-xs text-gray-500">{kpi.febPercent}%</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{kpi.march}</div>
                        <div className="text-xs text-gray-500">{kpi.marPercent}%</div>
                      </div>
                    </TableCell>
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
