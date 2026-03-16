import { BarChart, Bar, CartesianGrid, XAxis, YAxis } from 'recharts';
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '../ui/chart';

interface GoalPerformanceChartProps {
  data: Array<{ goal: string; target: number; accomplished: number; percentage: number }>;
}

const chartConfig = {
  target: {
    label: 'Target',
    color: 'var(--color-chart-3)',
  },
  accomplished: {
    label: 'Accomplished',
    color: 'var(--color-chart-1)',
  },
} satisfies ChartConfig;

export function GoalPerformanceChart({ data }: GoalPerformanceChartProps) {
  return (
    <ChartContainer config={chartConfig} className="h-[350px] w-full">
      <BarChart data={data} margin={{ top: 12, right: 8, left: 8, bottom: 4 }} barGap={8}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis
          dataKey="goal"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          tickFormatter={(value) => Number(value).toLocaleString()}
        />
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent formatter={(value) => Number(value).toLocaleString()} />}
        />
        <ChartLegend content={<ChartLegendContent />} />
        <Bar dataKey="target" fill="var(--color-target)" radius={[6, 6, 0, 0]} />
        <Bar dataKey="accomplished" fill="var(--color-accomplished)" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ChartContainer>
  );
}
