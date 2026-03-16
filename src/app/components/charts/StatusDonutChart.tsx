import { Cell, Pie, PieChart } from 'recharts';
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from '../ui/chart';

interface StatusDonutChartProps {
  data: Array<{ name: string; value: number; color: string }>;
}

export function StatusDonutChart({ data }: StatusDonutChartProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <ChartContainer
      config={Object.fromEntries(
        data.map((item) => [item.name, { label: item.name, color: item.color }]),
      )}
      className="h-[300px] w-full"
    >
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={70}
          outerRadius={105}
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
          <tspan x="50%" dy="-0.35em" className="text-xl font-semibold">{total}</tspan>
          <tspan x="50%" dy="1.3em" className="fill-muted-foreground text-xs">Total KPIs</tspan>
        </text>
        <ChartTooltip content={<ChartTooltipContent />} />
        <ChartLegend content={<ChartLegendContent />} />
      </PieChart>
    </ChartContainer>
  );
}
