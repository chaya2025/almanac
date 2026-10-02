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
import ChartFrame, { axisStyle, palette, tooltipStyle, gridProps, xAxisLine, Gradient } from './ChartFrame';

type Point = { date: string; kg: number; trend: number | null };

export default function WeightChart({
  data,
  height = 220,
}: {
  data: Point[];
  height?: number;
}) {
  if (data.length < 2) {
    return (
      <ChartFrame
        height={height}
        empty
        emptyText={
          data.length === 0
            ? 'no weigh-ins yet — log one to start the chart.'
            : 'one weigh-in logged. Add another (Sunday is the day) to see your trend.'
        }
      >
        <></>
      </ChartFrame>
    );
  }
  const min = Math.floor(Math.min(...data.map((d) => d.kg)) - 1);
  const max = Math.ceil(Math.max(...data.map((d) => d.kg)) + 1);
  const sundays = data.filter((d) => getDay(parseISO(d.date)) === 0);

  return (
    <ChartFrame height={height}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
          <defs>
            <Gradient id="weight-fill" color={palette.sun} from={0.7} to={0.05} />
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
            cursor={{ stroke: palette.tang, strokeWidth: 2, strokeDasharray: '4 4' }}
            labelFormatter={(d) => format(parseISO(d), 'EEEE, d MMM yyyy')}
            formatter={(v: number, name) => [
              `${v.toFixed(1)} kg`,
              name === 'kg' ? 'weighed' : '4-pt trend',
            ]}
          />
          <Area
            type="monotone"
            dataKey="kg"
            stroke={palette.ink}
            strokeWidth={2.5}
            fill="url(#weight-fill)"
            dot={{ stroke: palette.ink, fill: palette.white, strokeWidth: 2, r: 3.5 }}
            activeDot={{ stroke: palette.ink, fill: palette.sun, strokeWidth: 2, r: 6 }}
            isAnimationActive
          />
          <Line
            type="monotone"
            dataKey="trend"
            stroke={palette.tang}
            strokeWidth={3}
            strokeLinecap="round"
            dot={false}
            isAnimationActive
          />
          {sundays.map((s) => (
            <ReferenceDot
              key={s.date}
              x={s.date}
              y={s.kg}
              r={5}
              fill={palette.tang}
              stroke={palette.ink}
              strokeWidth={2}
            />
          ))}
        </ComposedChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}
