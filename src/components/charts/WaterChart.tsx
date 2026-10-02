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
import ChartFrame, { axisStyle, palette, tooltipStyle, labelStyle, gridProps, xAxisLine, Gradient } from './ChartFrame';

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
        <BarChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
          <defs>
            <Gradient id="water-hit" color={palette.aqua} from={1} to={0.7} />
            <Gradient id="water-near" color={palette.aqua} from={0.7} to={0.35} />
            <Gradient id="water-low" color={palette.aqua} from={0.35} to={0.15} />
          </defs>
          <CartesianGrid {...gridProps} />
          <XAxis
            dataKey="date"
            tick={axisStyle}
            tickLine={false}
            axisLine={xAxisLine}
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
            stroke={palette.night}
            strokeWidth={2}
            strokeDasharray="6 5"
            label={{ value: `target ${(targetMl / 1000).toFixed(1)}L`, position: 'insideTopRight', ...labelStyle, fill: palette.night }}
          />
          <Tooltip
            contentStyle={tooltipStyle}
            cursor={{ fill: palette.aqua, opacity: 0.12 }}
            labelFormatter={(d) => format(parseISO(d), 'EEEE, d MMM')}
            formatter={(v: number) => [`${(v / 1000).toFixed(2)} L`, 'water']}
          />
          <Bar dataKey="ml" isAnimationActive radius={[8, 8, 3, 3]} stroke={palette.ink} strokeWidth={1.5} maxBarSize={28}>
            {data.map((d, i) => (
              <Cell
                key={i}
                fill={d.ml >= targetMl ? 'url(#water-hit)' : d.ml >= targetMl * 0.7 ? 'url(#water-near)' : 'url(#water-low)'}
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
