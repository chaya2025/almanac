import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { format, parseISO } from 'date-fns';
import ChartFrame, { axisStyle, palette, tooltipStyle, labelStyle, gridProps, xAxisLine, Gradient } from './ChartFrame';

type Point = { date: string; hours: number | null; rolling?: number | null; bedtimeH?: number | null };

export default function SleepChart({
  data,
  target,
  height = 220,
  granularity,
}: {
  data: Point[];
  target: number;
  height?: number;
  granularity: 'daily' | 'weekly' | 'monthly';
}) {
  const empty = !data.some((d) => d.hours != null);
  const hasBedtime = data.filter((d) => d.bedtimeH != null).length >= 3;
  return (
    <ChartFrame height={height} empty={empty}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 10, right: 8, bottom: 0, left: 0 }}>
          <defs>
            <Gradient id="sleep-fill" color={palette.night} from={0.75} to={0.08} />
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
            domain={[0, 12]}
            ticks={[0, 4, 8, 12]}
            tickFormatter={(v) => `${v}h`}
            width={36}
          />
          <ReferenceLine
            y={target}
            stroke={palette.coral}
            strokeWidth={2}
            strokeDasharray="6 5"
            label={{ value: `target ${target}h`, position: 'insideTopRight', ...labelStyle, fill: palette.coral }}
          />
          <Tooltip
            contentStyle={tooltipStyle}
            cursor={{ stroke: palette.night, strokeWidth: 2, strokeDasharray: '4 4' }}
            labelFormatter={(d) => format(parseISO(d), 'EEEE, d MMM')}
            formatter={(v: number, name) => [
              v != null ? `${v.toFixed(1)} h` : '—',
              name === 'hours' ? 'sleep' : '7d avg',
            ]}
          />
          <Area
            type="monotone"
            dataKey="hours"
            stroke={palette.night}
            strokeWidth={3}
            fill="url(#sleep-fill)"
            dot={{ stroke: palette.ink, fill: palette.white, strokeWidth: 2, r: 3.5 }}
            activeDot={{ stroke: palette.ink, fill: palette.sun, strokeWidth: 2, r: 6 }}
            isAnimationActive
            connectNulls
          />
          {data.some((d) => d.rolling != null) && (
            <Area
              type="monotone"
              dataKey="rolling"
              stroke={palette.pink}
              strokeWidth={3}
              strokeLinecap="round"
              fill="none"
              dot={false}
              isAnimationActive
            />
          )}
          {hasBedtime && (
            <Line
              type="monotone"
              dataKey="bedtimeH"
              stroke={palette.leaf}
              strokeWidth={2}
              strokeDasharray="4 4"
              dot={{ stroke: palette.leaf, fill: palette.white, strokeWidth: 2, r: 2.5 }}
              isAnimationActive
              connectNulls
            />
          )}
        </ComposedChart>
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
