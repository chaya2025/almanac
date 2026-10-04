import {
  CartesianGrid,
  Line,
  ComposedChart,
  Area,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  ReferenceDot,
} from 'recharts';
import { format, parseISO, getDay } from 'date-fns';
import { DEFAULT_WEIGH_IN_DAY, WEEKDAYS } from '@/lib/weight';
import ChartFrame, { axisStyle, palette, tooltipStyle, gridProps, xAxisLine, Gradient } from './ChartFrame';

type Point = { date: string; kg: number; trend: number | null };

export default function WeightChart({
  data,
  height = 220,
  weighInDay = DEFAULT_WEIGH_IN_DAY,
}: {
  data: Point[];
  height?: number;
  weighInDay?: number;
}) {
  if (data.length < 2) {
    return (
      <ChartFrame
        height={height}
        empty
        emptyText={
          data.length === 0
            ? 'no weigh-ins yet — log one to start the chart.'
            : `one weigh-in logged. Add another (${WEEKDAYS[weighInDay]} is the day) to see your trend.`
        }
      >
        <></>
      </ChartFrame>
    );
  }
  const min = Math.floor(Math.min(...data.map((d) => d.kg)) - 1);
  const max = Math.ceil(Math.max(...data.map((d) => d.kg)) + 1);
  const weighIns = data.filter((d) => getDay(parseISO(d.date)) === weighInDay);

  return (
    <ChartFrame height={height}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
          <defs>
            <Gradient id="weight-fill" color={palette.sun} from={0.25} to={0.02} />
          </defs>
          <CartesianGrid {...gridProps} />
          <XAxis
            dataKey="date"
            tick={axisStyle}
            tickLine={false}
            axisLine={xAxisLine}
            tickFormatter={(d) => format(parseISO(d), 'd MMM')}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={axisStyle}
            tickLine={false}
            axisLine={false}
            domain={[min, max]}
            tickFormatter={(v) => `${v}kg`}
            width={42}
          />
          <Tooltip
            contentStyle={tooltipStyle}
            cursor={{ stroke: palette.ink, strokeDasharray: '2 4' }}
            labelFormatter={(d) => format(parseISO(d), 'EEEE, d MMM yyyy')}
            formatter={(v: number, name) => [
              `${v.toFixed(1)} kg`,
              name === 'kg' ? 'weighed' : '4-pt trend',
            ]}
          />
          <Area
            type="monotone"
            dataKey="kg"
            stroke={palette.sun}
            strokeWidth={2}
            fill="url(#weight-fill)"
            dot={{ stroke: palette.sun, fill: palette.white, strokeWidth: 1.5, r: 3 }}
            activeDot={{ stroke: palette.white, fill: palette.sun, strokeWidth: 2, r: 5 }}
            isAnimationActive
          />
          <Line
            type="monotone"
            dataKey="trend"
            stroke={palette.inkSoft}
            strokeWidth={1.25}
            strokeDasharray="4 4"
            dot={false}
            isAnimationActive
          />
          {weighIns.map((s) => (
            <ReferenceDot
              key={s.date}
              x={s.date}
              y={s.kg}
              r={4}
              fill={palette.sun}
              stroke={palette.white}
              strokeWidth={1.5}
            />
          ))}
        </ComposedChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}
