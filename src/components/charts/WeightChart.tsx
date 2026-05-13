import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  ReferenceDot,
} from 'recharts';
import { format, parseISO, getDay } from 'date-fns';
import ChartFrame, { axisStyle, palette, tooltipStyle } from './ChartFrame';

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
        <LineChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: -16 }}>
          <CartesianGrid stroke={palette.rule} vertical={false} strokeDasharray="2 4" />
          <XAxis
            dataKey="date"
            tick={axisStyle}
            tickLine={false}
            axisLine={{ stroke: palette.ink }}
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
          <Line
            type="monotone"
            dataKey="kg"
            stroke={palette.ink}
            strokeWidth={1.5}
            dot={{ stroke: palette.ink, fill: palette.paper, strokeWidth: 1.5, r: 3 }}
            activeDot={{ stroke: palette.clayDeep, fill: palette.paper, strokeWidth: 2, r: 5 }}
            isAnimationActive
          />
          <Line
            type="monotone"
            dataKey="trend"
            stroke={palette.clayDeep}
            strokeWidth={2}
            strokeDasharray="3 3"
            dot={false}
            isAnimationActive
          />
          {sundays.map((s) => (
            <ReferenceDot
              key={s.date}
              x={s.date}
              y={s.kg}
              r={4}
              fill={palette.clayDeep}
              stroke={palette.paper}
              strokeWidth={1.5}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}
