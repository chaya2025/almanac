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
  return (
    <ChartFrame height={height} empty={empty}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 10, right: 8, bottom: 0, left: 0 }}>
          <defs>
            <Gradient id="sleep-fill" color={palette.night} from={0.28} to={0.02} />
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
            stroke={palette.inkMute}
            strokeDasharray="3 4"
            label={{ value: `target ${target}h`, position: 'insideTopRight', ...labelStyle }}
          />
          <Tooltip
            contentStyle={tooltipStyle}
            cursor={{ stroke: palette.ink, strokeWidth: 1, strokeDasharray: '2 4' }}
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
            strokeWidth={2}
            fill="url(#sleep-fill)"
            dot={false}
            activeDot={{ stroke: palette.white, fill: palette.night, strokeWidth: 2, r: 5 }}
            isAnimationActive
            connectNulls
          />
          {data.some((d) => d.rolling != null) && (
            <Area
              type="monotone"
              dataKey="rolling"
              stroke={palette.pink}
              strokeWidth={1.5}
              strokeDasharray="5 4"
              fill="none"
              dot={false}
              isAnimationActive
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
