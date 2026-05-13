import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { format, parseISO } from 'date-fns';
import ChartFrame, { axisStyle, palette, tooltipStyle, labelStyle } from './ChartFrame';

type Point = { date: string; hours: number | null; rolling?: number | null };

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
        <AreaChart data={data} margin={{ top: 10, right: 8, bottom: 0, left: -16 }}>
          <defs>
            <pattern id="sleep-hatch" patternUnits="userSpaceOnUse" width="6" height="6" patternTransform="rotate(45)">
              <line x1="0" y1="0" x2="0" y2="6" stroke={palette.ink} strokeWidth="1" opacity="0.45" />
            </pattern>
          </defs>
          <CartesianGrid stroke={palette.rule} vertical={false} strokeDasharray="2 4" />
          <XAxis
            dataKey="date"
            tick={axisStyle}
            tickLine={false}
            axisLine={{ stroke: palette.ink, strokeWidth: 1 }}
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
            stroke={palette.clay}
            strokeDasharray="4 4"
            label={{ value: `target ${target}h`, position: 'right', ...labelStyle, fill: palette.clayDeep }}
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
            stroke={palette.ink}
            strokeWidth={1.5}
            fill="url(#sleep-hatch)"
            dot={{ stroke: palette.ink, fill: palette.paper, strokeWidth: 1, r: 2.5 }}
            activeDot={{ stroke: palette.clayDeep, fill: palette.paper, strokeWidth: 2, r: 4 }}
            isAnimationActive
            connectNulls
          />
          {data.some((d) => d.rolling != null) && (
            <Area
              type="monotone"
              dataKey="rolling"
              stroke={palette.clayDeep}
              strokeWidth={2}
              fill="none"
              dot={false}
              isAnimationActive
            />
          )}
        </AreaChart>
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
