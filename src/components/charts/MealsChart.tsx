import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { format, parseISO } from 'date-fns';
import ChartFrame, { axisStyle, palette, tooltipStyle } from './ChartFrame';
import type { FoodGroup } from '@/types';

type Stack = { date: string } & Partial<Record<FoodGroup, number>>;

const GROUP_COLORS: Record<FoodGroup, string> = {
  protein: palette.clayDeep,
  veg: palette.mossDeep,
  fruit: palette.moss,
  grain: palette.amber,
  dairy: palette.inkSoft,
  fat: palette.inkMute,
  sweet: palette.clay,
  drink: palette.rule,
};

const ORDER: FoodGroup[] = ['veg', 'fruit', 'protein', 'grain', 'dairy', 'fat', 'sweet', 'drink'];

export default function MealsChart({
  data,
  height = 220,
  granularity,
}: {
  data: Stack[];
  height?: number;
  granularity: 'daily' | 'weekly' | 'monthly';
}) {
  const empty = !data.some((d) => ORDER.some((g) => (d as any)[g] > 0));
  return (
    <ChartFrame height={height} empty={empty}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 8, left: -16 }}>
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
            allowDecimals={false}
            width={28}
          />
          <Tooltip
            contentStyle={tooltipStyle}
            cursor={{ fill: palette.ink, opacity: 0.04 }}
            labelFormatter={(d) => format(parseISO(d), 'EEEE, d MMM')}
          />
          <Legend
            iconSize={10}
            wrapperStyle={{
              fontFamily: '"DM Sans", sans-serif',
              fontSize: 10,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: palette.inkMute,
              paddingTop: 4,
            }}
          />
          {ORDER.map((g) => (
            <Bar
              key={g}
              dataKey={g}
              stackId="a"
              fill={GROUP_COLORS[g]}
              isAnimationActive
            />
          ))}
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
