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
            <Gradient id="water-bar" color={palette.aqua} from={0.95} to={0.6} />
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
            stroke={palette.inkMute}
            strokeDasharray="3 4"
            label={{ value: `target ${(targetMl / 1000).toFixed(1)}L`, position: 'insideTopRight', ...labelStyle }}
          />
          <Tooltip
            contentStyle={tooltipStyle}
            cursor={{ fill: palette.ink, opacity: 0.03 }}
            labelFormatter={(d) => format(parseISO(d), 'EEEE, d MMM')}
            formatter={(v: number) => [`${(v / 1000).toFixed(2)} L`, 'water']}
          />
          <Bar dataKey="ml" isAnimationActive radius={[4, 4, 0, 0]} maxBarSize={22}>
            {data.map((d, i) => (
              <Cell
                key={i}
                fill="url(#water-bar)"
                fillOpacity={d.ml >= targetMl ? 1 : d.ml >= targetMl * 0.7 ? 0.65 : 0.35}
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
