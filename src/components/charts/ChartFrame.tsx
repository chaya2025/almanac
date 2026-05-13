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
        className="flex items-center justify-center border border-dashed border-rule px-6 text-center"
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
  paper: 'rgb(245 239 227)',
  ink: 'rgb(26 22 18)',
  inkSoft: 'rgb(74 66 58)',
  inkMute: 'rgb(139 126 108)',
  rule: 'rgb(212 201 176)',
  clay: 'rgb(184 83 61)',
  clayDeep: 'rgb(143 63 46)',
  moss: 'rgb(90 107 58)',
  mossDeep: 'rgb(68 82 44)',
  amber: 'rgb(200 149 68)',
};

export const axisStyle = {
  fontFamily: '"DM Mono", monospace',
  fontSize: 10,
  fill: palette.inkMute,
  letterSpacing: '0.08em',
  textTransform: 'uppercase' as const,
};

export const tooltipStyle = {
  backgroundColor: palette.paper,
  border: `1px solid ${palette.ink}`,
  borderRadius: 0,
  padding: '8px 10px',
  fontFamily: '"DM Mono", monospace',
  fontSize: 11,
  color: palette.ink,
  boxShadow: '0 8px 30px rgba(0,0,0,0.08)',
};

export const labelStyle = {
  color: palette.inkMute,
  fontFamily: '"DM Sans", sans-serif',
  fontSize: 10,
  letterSpacing: '0.18em',
  textTransform: 'uppercase' as const,
};
