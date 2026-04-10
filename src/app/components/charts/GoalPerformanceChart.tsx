import { BarChart, Bar, CartesianGrid, XAxis, YAxis } from 'recharts';
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '../ui/chart';
import { useIsMobile } from '../ui/use-mobile';

interface GoalPerformanceChartProps {
  data: Array<{ goal: string; target: number; accomplished: number; percentage: number }>;
  exportTitle?: string;
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

export function GoalPerformanceChart({ data, exportTitle = 'Goal Performance' }: GoalPerformanceChartProps) {
  const isMobile = useIsMobile();

  return (
    <ChartContainer
      config={chartConfig}
      exportTitle={exportTitle}
      exportData={data}
      className={isMobile ? 'h-[280px] w-full' : 'h-[350px] w-full'}
    >
      <BarChart data={data} margin={{ top: 12, right: 8, left: 8, bottom: 4 }} barGap={8}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis
          dataKey="goal"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          interval={isMobile ? 'preserveStartEnd' : 0}
          tick={{ fontSize: isMobile ? 10 : 12 }}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          tick={{ fontSize: isMobile ? 10 : 12 }}
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
