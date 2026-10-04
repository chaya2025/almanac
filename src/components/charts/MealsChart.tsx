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
import { GROUP_LABEL } from '@/types';

type Stack = { date: string } & Partial<Record<FoodGroup, number>>;

const GROUP_COLORS: Record<FoodGroup, string> = {
  veg: 'rgb(74 118 82)',
  fruit: 'rgb(140 170 110)',
  protein: 'rgb(184 92 56)',
  grain: 'rgb(184 140 52)',
  dairy: 'rgb(110 150 170)',
  fat: 'rgb(214 180 120)',
  sweet: 'rgb(140 62 96)',
  drink: 'rgb(200 196 186)',
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
            cursor={{ fill: palette.ink, opacity: 0.03 }}
            labelFormatter={(d) => format(parseISO(d), 'EEEE, d MMM')}
          />
          <Legend
            iconSize={8}
            iconType="circle"
            wrapperStyle={{
              fontFamily: '"DM Sans", sans-serif',
              fontSize: 10,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: palette.inkMute,
              paddingTop: 4,
            }}
          />
          {ORDER.map((g) => (
            <Bar
              key={g}
              dataKey={g}
              name={GROUP_LABEL[g]}
              stackId="a"
              fill={GROUP_COLORS[g]}
              maxBarSize={22}
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
