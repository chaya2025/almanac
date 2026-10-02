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

type Point = { date: string; minutes: number; sessions: number };

export default function SportChart({
  data,
  weeklyTargetMin,
  height = 220,
  granularity,
}: {
  data: Point[];
  weeklyTargetMin: number;
  height?: number;
  granularity: 'daily' | 'weekly' | 'monthly';
}) {
  const empty = !data.some((d) => d.minutes > 0);
  // For daily, target line shows daily-equivalent
  const referenceY =
    granularity === 'daily'
      ? Math.round(weeklyTargetMin / 7)
      : granularity === 'weekly'
        ? weeklyTargetMin
        : weeklyTargetMin * 4;

  return (
    <ChartFrame height={height} empty={empty}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <defs>
            <Gradient id="sport-hit" color={palette.leaf} from={1} to={0.65} />
            <Gradient id="sport-some" color={palette.tang} from={0.95} to={0.5} />
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
            tickFormatter={(v) => `${v}m`}
            width={36}
          />
          <ReferenceLine
            y={referenceY}
            stroke={palette.night}
            strokeWidth={2}
            strokeDasharray="6 5"
            label={{ value: `${referenceY}m goal`, position: 'insideTopRight', ...labelStyle, fill: palette.night }}
          />
          <Tooltip
            contentStyle={tooltipStyle}
            cursor={{ fill: palette.leaf, opacity: 0.12 }}
            labelFormatter={(d) => format(parseISO(d), 'EEEE, d MMM')}
            formatter={(v: number, name: string, ctx) => {
              if (name === 'minutes') {
                const sessions = (ctx?.payload as Point | undefined)?.sessions ?? 0;
                return [`${v}m · ${sessions} session${sessions === 1 ? '' : 's'}`, 'sport'];
              }
              return [v, name];
            }}
          />
          <Bar dataKey="minutes" isAnimationActive radius={[8, 8, 3, 3]} stroke={palette.ink} maxBarSize={28}>
            {data.map((d, i) => (
              <Cell
                key={i}
                fill={d.minutes >= referenceY ? 'url(#sport-hit)' : d.minutes > 0 ? 'url(#sport-some)' : 'transparent'}
                strokeWidth={d.minutes > 0 ? 1.5 : 0}
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
  if (g === 'daily') return format(date, 'EEE d');
  if (g === 'weekly') return format(date, "'W'w");
  return format(date, 'MMM');
}
