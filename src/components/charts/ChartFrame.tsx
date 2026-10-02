import type { ReactNode } from 'react';

type Props = {
  height?: number;
  empty?: boolean;
  emptyText?: string;
  children: ReactNode;
};

export default function ChartFrame({ height = 200, empty, emptyText = 'no data yet — start logging to see your chronicle take shape.', children }: Props) {
  if (empty) {
    return (
      <div
        className="flex items-center justify-center border border-dashed border-rule rounded-xl bg-paper/60 px-6 text-center"
        style={{ height }}
      >
        <span className="font-serif italic text-ink-mute max-w-xs leading-relaxed text-sm">
          {emptyText}
        </span>
      </div>
    );
  }
  return (
    <div className="relative" style={{ height }}>
      {children}
    </div>
  );
}

export const palette = {
  paper: 'rgb(247 245 240)',
  white: '#ffffff',
  ink: 'rgb(28 30 36)',
  inkSoft: 'rgb(76 78 86)',
  inkMute: 'rgb(128 128 136)',
  rule: 'rgb(226 222 212)',
  clay: 'rgb(184 92 56)',
  clayDeep: 'rgb(150 60 52)',
  moss: 'rgb(74 118 82)',
  mossDeep: 'rgb(58 96 66)',
  amber: 'rgb(184 140 52)',
  // section colours
  night: 'rgb(58 74 140)',
  tang: 'rgb(184 92 56)',
  aqua: 'rgb(38 120 132)',
  pink: 'rgb(140 62 96)',
  leaf: 'rgb(74 118 82)',
  sun: 'rgb(184 140 52)',
  coral: 'rgb(150 60 52)',
};

export const axisStyle = {
  fontFamily: '"DM Mono", monospace',
  fontSize: 10,
  fill: palette.inkMute,
  letterSpacing: '0.06em',
};

export const tooltipStyle = {
  backgroundColor: 'rgba(255,255,255,0.97)',
  border: `1px solid ${palette.rule}`,
  borderRadius: 10,
  padding: '8px 12px',
  fontFamily: '"DM Mono", monospace',
  fontSize: 11,
  color: palette.ink,
  boxShadow: '0 10px 30px -12px rgba(28,30,36,0.25)',
};

export const labelStyle = {
  color: palette.inkMute,
  fontFamily: '"DM Sans", sans-serif',
  fontSize: 10,
  letterSpacing: '0.12em',
  textTransform: 'uppercase' as const,
};

export const gridProps = { stroke: palette.rule, vertical: false, strokeDasharray: '0' } as const;
export const xAxisLine = { stroke: palette.rule } as const;

/** Vertical gradient from a colour to a lighter wash, for bars and areas. */
export function Gradient({ id, color, from = 1, to = 0.25 }: { id: string; color: string; from?: number; to?: number }) {
  return (
    <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor={color} stopOpacity={from} />
      <stop offset="100%" stopColor={color} stopOpacity={to} />
    </linearGradient>
  );
}
