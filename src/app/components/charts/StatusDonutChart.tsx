import { Cell, Pie, PieChart } from 'recharts';
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from '../ui/chart';
import { useIsMobile } from '../ui/use-mobile';

interface StatusDonutChartProps {
  data: Array<{ name: string; value: number; color: string }>;
  exportTitle?: string;
  centerLabel?: string;
}

export function StatusDonutChart({
  data,
  exportTitle = 'Status Breakdown',
  centerLabel = 'Total',
}: StatusDonutChartProps) {
  const isMobile = useIsMobile();
  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <ChartContainer
      config={Object.fromEntries(
        data.map((item) => [item.name, { label: item.name, color: item.color }]),
      )}
      exportTitle={exportTitle}
      exportData={data}
      className={isMobile ? 'h-[240px] w-full !aspect-auto' : 'h-[300px] w-full !aspect-auto'}
    >
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={isMobile ? 48 : 70}
          outerRadius={isMobile ? 76 : 105}
          paddingAngle={2}
          dataKey="value"
          nameKey="name"
          stroke="transparent"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <text
          x="50%"
          y="50%"
          textAnchor="middle"
          dominantBaseline="middle"
          className="fill-foreground"
        >
          <tspan x="50%" dy="-0.35em" className={isMobile ? 'text-lg font-semibold' : 'text-xl font-semibold'}>{total}</tspan>
          <tspan x="50%" dy="1.3em" className="fill-muted-foreground text-xs">{centerLabel}</tspan>
        </text>
        <ChartTooltip content={<ChartTooltipContent />} />
        <ChartLegend
          content={
            <ChartLegendContent
              className={
                isMobile
                  ? 'gap-x-2 gap-y-1 text-[10px] [&>div]:min-w-0 [&>div]:max-w-full'
                  : 'gap-x-3 gap-y-1 text-[11px]'
              }
            />
          }
        />
      </PieChart>
    </ChartContainer>
  );
}
