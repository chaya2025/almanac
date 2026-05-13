import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { format, parseISO } from 'date-fns';
import ChartFrame, { axisStyle, palette, tooltipStyle, labelStyle } from './ChartFrame';

type Point = { date: string; ml: number };

export default function WaterChart({
  data,
  targetMl,
  height = 220,
  granularity,
}: {
  data: Point[];
  targetMl: number;
  height?: number;
  granularity: 'daily' | 'weekly' | 'monthly';
}) {
  const empty = !data.some((d) => d.ml > 0);
  return (
    <ChartFrame height={height} empty={empty}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: -8 }}>
          <CartesianGrid stroke={palette.rule} vertical={false} strokeDasharray="2 4" />
          <XAxis
            dataKey="date"
            tick={axisStyle}
            tickLine={false}
            axisLine={{ stroke: palette.ink }}
            tickFormatter={(d) => formatTick(d, granularity)}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={axisStyle}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => `${(v / 1000).toFixed(1)}L`}
            width={36}
          />
          <ReferenceLine
            y={targetMl}
            stroke={palette.clay}
            strokeDasharray="4 4"
            label={{ value: `target ${(targetMl / 1000).toFixed(1)}L`, position: 'right', ...labelStyle, fill: palette.clayDeep }}
          />
          <Tooltip
            contentStyle={tooltipStyle}
            cursor={{ fill: palette.ink, opacity: 0.04 }}
            labelFormatter={(d) => format(parseISO(d), 'EEEE, d MMM')}
            formatter={(v: number) => [`${(v / 1000).toFixed(2)} L`, 'water']}
          />
          <Bar dataKey="ml" isAnimationActive>
            {data.map((d, i) => (
              <Cell
                key={i}
                fill={d.ml >= targetMl ? palette.mossDeep : d.ml >= targetMl * 0.7 ? palette.moss : palette.amber}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}

function formatTick(d: string, g: 'daily' | 'weekly' | 'monthly') {
  const date = parseISO(d);
  if (g === 'daily') return format(date, 'd MMM');
  if (g === 'weekly') return format(date, "'W'w");
  return format(date, 'MMM');
}
