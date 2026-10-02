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
        className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-ink/25 rounded-2xl bg-tone-soft/50 px-6 text-center"
        style={{ height }}
      >
        <span className="text-3xl animate-float" aria-hidden>✦</span>
        <span className="font-serif italic text-ink-soft max-w-xs leading-relaxed text-sm">
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
  paper: 'rgb(255 247 232)',
  white: '#ffffff',
  ink: 'rgb(30 22 48)',
  inkSoft: 'rgb(72 60 96)',
  inkMute: 'rgb(130 116 150)',
  rule: 'rgb(30 22 48 / 0.1)',
  clay: 'rgb(255 92 72)',
  clayDeep: 'rgb(214 52 48)',
  moss: 'rgb(46 196 120)',
  mossDeep: 'rgb(18 150 88)',
  amber: 'rgb(255 176 32)',
  night: 'rgb(98 84 255)',
  tang: 'rgb(255 128 28)',
  aqua: 'rgb(18 178 232)',
  pink: 'rgb(255 72 150)',
  leaf: 'rgb(46 196 120)',
  sun: 'rgb(255 196 40)',
  coral: 'rgb(255 92 72)',
};

export const axisStyle = {
  fontFamily: '"DM Mono", monospace',
  fontSize: 10,
  fontWeight: 500,
  fill: palette.inkMute,
  letterSpacing: '0.06em',
  textTransform: 'uppercase' as const,
};

export const tooltipStyle = {
  backgroundColor: palette.white,
  border: `2px solid ${palette.ink}`,
  borderRadius: 14,
  padding: '8px 12px',
  fontFamily: '"DM Mono", monospace',
  fontSize: 11,
  color: palette.ink,
  boxShadow: `3px 3px 0 0 ${palette.ink}`,
};

export const labelStyle = {
  color: palette.ink,
  fontFamily: '"DM Sans", sans-serif',
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: '0.14em',
  textTransform: 'uppercase' as const,
};

// Shared bits every chart uses
export const gridProps = { stroke: palette.rule, vertical: false, strokeDasharray: '0' } as const;
export const xAxisLine = { stroke: palette.ink, strokeWidth: 2 } as const;

/** Vertical gradient from a colour to a lighter wash, for bars and areas. */
export function Gradient({ id, color, from = 1, to = 0.25 }: { id: string; color: string; from?: number; to?: number }) {
  return (
    <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor={color} stopOpacity={from} />
      <stop offset="100%" stopColor={color} stopOpacity={to} />
    </linearGradient>
  );
}
