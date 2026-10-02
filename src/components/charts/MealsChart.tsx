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
import ChartFrame, { axisStyle, palette, tooltipStyle, gridProps, xAxisLine } from './ChartFrame';
import type { FoodGroup } from '@/types';

type Stack = { date: string } & Partial<Record<FoodGroup, number>>;

const GROUP_COLORS: Record<FoodGroup, string> = {
  protein: palette.coral,
  veg: palette.leaf,
  fruit: palette.pink,
  grain: palette.sun,
  dairy: palette.aqua,
  fat: palette.tang,
  sweet: palette.night,
  drink: 'rgb(170 160 190)',
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
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 8, left: 0 }}>
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
            allowDecimals={false}
            width={28}
          />
          <Tooltip
            contentStyle={tooltipStyle}
            cursor={{ fill: palette.tang, opacity: 0.1 }}
            labelFormatter={(d) => format(parseISO(d), 'EEEE, d MMM')}
          />
          <Legend
            iconSize={10}
            iconType="circle"
            wrapperStyle={{
              fontFamily: '"DM Sans", sans-serif',
              fontSize: 10,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              fontWeight: 700,
              color: palette.inkSoft,
              paddingTop: 4,
            }}
          />
          {ORDER.map((g) => (
            <Bar
              key={g}
              dataKey={g}
              stackId="a"
              fill={GROUP_COLORS[g]}
              stroke={palette.ink}
              strokeWidth={1}
              maxBarSize={28}
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
