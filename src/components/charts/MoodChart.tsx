import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { format, parseISO } from 'date-fns';
import ChartFrame, { axisStyle, palette, tooltipStyle, gridProps, xAxisLine } from './ChartFrame';

type Point = {
  date: string;
  mood: number | null;
  energy: number | null;
  sleepHours: number | null;
};

export default function MoodChart({
  data,
  height = 240,
  granularity,
}: {
  data: Point[];
  height?: number;
  granularity: 'daily' | 'weekly' | 'monthly';
}) {
  const empty = !data.some((d) => d.mood != null || d.energy != null);
  return (
    <ChartFrame height={height} empty={empty}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
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
            yAxisId="mood"
            tick={axisStyle}
            tickLine={false}
            axisLine={false}
            domain={[1, 5]}
            ticks={[1, 2, 3, 4, 5]}
            width={28}
          />
          <YAxis
            yAxisId="sleep"
            orientation="right"
            tick={axisStyle}
            tickLine={false}
            axisLine={false}
            domain={[0, 12]}
            ticks={[0, 6, 12]}
            tickFormatter={(v) => `${v}h`}
            width={28}
          />
          <Tooltip
            contentStyle={tooltipStyle}
            cursor={{ stroke: palette.ink, strokeDasharray: '2 4' }}
            labelFormatter={(d) => format(parseISO(d), 'EEEE, d MMM')}
          />
          <Bar
            yAxisId="sleep"
            dataKey="sleepHours"
            fill={palette.night}
            opacity={0.14}
            radius={[3, 3, 0, 0]}
            barSize={8}
            isAnimationActive
          />
          <Line
            yAxisId="mood"
            type="monotone"
            dataKey="mood"
            stroke={palette.pink}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 5, stroke: palette.white, strokeWidth: 2, fill: palette.pink }}
            isAnimationActive
            connectNulls
          />
          <Line
            yAxisId="mood"
            type="monotone"
            dataKey="energy"
            stroke={palette.sun}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 5, stroke: palette.white, strokeWidth: 2, fill: palette.sun }}
            isAnimationActive
            connectNulls
          />
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
