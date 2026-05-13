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
import ChartFrame, { axisStyle, palette, tooltipStyle, labelStyle } from './ChartFrame';

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
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
          <CartesianGrid stroke={palette.rule} vertical={false} strokeDasharray="2 4" />
          <XAxis
            dataKey="date"
            tick={axisStyle}
            tickLine={false}
            axisLine={{ stroke: palette.ink }}
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
            stroke={palette.clay}
            strokeDasharray="4 4"
            label={{ value: `${referenceY}m goal`, position: 'right', ...labelStyle, fill: palette.clayDeep }}
          />
          <Tooltip
            contentStyle={tooltipStyle}
            cursor={{ fill: palette.ink, opacity: 0.04 }}
            labelFormatter={(d) => format(parseISO(d), 'EEEE, d MMM')}
            formatter={(v: number, name: string, ctx) => {
              if (name === 'minutes') {
                const sessions = (ctx?.payload as Point | undefined)?.sessions ?? 0;
                return [`${v}m · ${sessions} session${sessions === 1 ? '' : 's'}`, 'sport'];
              }
              return [v, name];
            }}
          />
          <Bar dataKey="minutes" isAnimationActive>
            {data.map((d, i) => (
              <Cell
                key={i}
                fill={d.minutes >= referenceY ? palette.mossDeep : d.minutes > 0 ? palette.clay : palette.rule}
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
