import { ReactNode } from 'react';
import clsx from 'clsx';

export type Tone = 'night' | 'tang' | 'aqua' | 'pink' | 'leaf' | 'sun' | 'coral' | 'ink';

type Props = {
  eyebrow?: string;
  title?: string;
  side?: ReactNode;
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
  tone?: Tone;
  icon?: string;
};

// Each area of the day has its own colour + glyph. Cards pick theirs from the
// eyebrow text, so pages don't have to pass a tone unless they want to override.
const RULES: { match: RegExp; tone: Tone; icon: string }[] = [
  { match: /sleep/i, tone: 'night', icon: '☾' },
  { match: /table|plate|cookbook|library|food/i, tone: 'tang', icon: '◐' },
  { match: /water/i, tone: 'aqua', icon: '💧' },
  { match: /constitution|mood/i, tone: 'pink', icon: '♥' },
  { match: /sport/i, tone: 'leaf', icon: '⚡' },
  { match: /weigh/i, tone: 'sun', icon: '★' },
  { match: /dispatch|journal|danger/i, tone: 'coral', icon: '✎' },
  { match: /pattern/i, tone: 'night', icon: '✦' },
  { match: /install/i, tone: 'aqua', icon: '↓' },
  { match: /data/i, tone: 'leaf', icon: '⇅' },
  { match: /profile/i, tone: 'pink', icon: '☺' },
];

export function toneFor(eyebrow?: string): { tone: Tone; icon: string } {
  const hit = eyebrow ? RULES.find((r) => r.match.test(eyebrow)) : undefined;
  return hit ?? { tone: 'sun', icon: '✦' };
}

export default function Card({ eyebrow, title, side, children, className, style, tone, icon }: Props) {
  const auto = toneFor(eyebrow);
  const t = tone ?? auto.tone;
  const glyph = icon ?? auto.icon;
  return (
    <section className={clsx('almanac-card reveal', `tone-${t}`, className)} style={style}>
      {(eyebrow || title || side) && (
        <header className="flex items-start justify-between gap-3 mb-4">
          <div className="min-w-0">
            {eyebrow && (
              <span className="tone-chip">
                <span className="tone-chip-icon" aria-hidden>{glyph}</span>
                {eyebrow}
              </span>
            )}
            {title && (
              <h3 className="font-display text-[1.7rem] leading-tight mt-2 font-bold tracking-tight">
                {title}
              </h3>
            )}
          </div>
          {side && <div className="shrink-0 pt-1">{side}</div>}
        </header>
      )}
      <div>{children}</div>
    </section>
  );
}
