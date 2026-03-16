import { CartesianGrid, Line, LineChart, XAxis, YAxis } from 'recharts';
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '../ui/chart';
import { useIsMobile } from '../ui/use-mobile';

interface MonthlyTrendChartProps {
  data: Array<{ month: string; total: number; avgPercentage: number }>;
}

const chartConfig = {
  total: {
    label: 'Total Accomplishment',
    color: 'var(--color-chart-1)',
  },
  avgPercentage: {
    label: 'Avg Percentage',
    color: 'var(--color-chart-2)',
  },
} satisfies ChartConfig;

export function MonthlyTrendChart({ data }: MonthlyTrendChartProps) {
  const isMobile = useIsMobile();

  return (
    <ChartContainer config={chartConfig} className={isMobile ? 'h-[260px] w-full' : 'h-[300px] w-full'}>
      <LineChart data={data} margin={{ top: 12, right: 8, left: 8, bottom: 4 }}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} tick={{ fontSize: isMobile ? 10 : 12 }} />
        <YAxis
          yAxisId="left"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          tick={{ fontSize: isMobile ? 10 : 12 }}
          tickFormatter={(value) => Number(value).toLocaleString()}
        />
        <YAxis
          yAxisId="right"
          orientation="right"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          tick={{ fontSize: isMobile ? 10 : 12 }}
          tickFormatter={(value) => `${Number(value)}%`}
        />
        <ChartTooltip
          content={
            <ChartTooltipContent
              formatter={(value, name) => {
                if (name === 'avgPercentage') return `${Number(value).toFixed(1)}%`;
                return Number(value).toLocaleString();
              }}
            />
          }
        />
        <ChartLegend content={<ChartLegendContent />} />
        <Line
          yAxisId="left"
          type="monotone"
          dataKey="total"
          stroke="var(--color-total)"
          strokeWidth={2.5}
          dot={{ r: 3, fill: 'var(--color-total)' }}
          activeDot={{ r: 5 }}
        />
        <Line
          yAxisId="right"
          type="monotone"
          dataKey="avgPercentage"
          stroke="var(--color-avgPercentage)"
          strokeWidth={2.5}
          strokeDasharray="6 4"
          dot={{ r: 3, fill: 'var(--color-avgPercentage)' }}
          activeDot={{ r: 5 }}
        />
      </LineChart>
    </ChartContainer>
  );
}
