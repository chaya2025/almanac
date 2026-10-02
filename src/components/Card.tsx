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
  /** optional photo shown as a band across the top of the card */
  image?: string;
  imagePosition?: string;
};

// Each area of the day has its own colour. Cards pick theirs from the eyebrow
// text, so pages don't have to pass a tone unless they want to override.
const RULES: { match: RegExp; tone: Tone }[] = [
  { match: /sleep/i, tone: 'night' },
  { match: /table|plate|cookbook|library|food/i, tone: 'tang' },
  { match: /water/i, tone: 'aqua' },
  { match: /constitution|mood/i, tone: 'pink' },
  { match: /sport/i, tone: 'leaf' },
  { match: /weigh/i, tone: 'sun' },
  { match: /dispatch|journal|danger/i, tone: 'coral' },
  { match: /pattern/i, tone: 'night' },
  { match: /install/i, tone: 'aqua' },
  { match: /data/i, tone: 'leaf' },
  { match: /profile/i, tone: 'pink' },
];

export function toneFor(eyebrow?: string): Tone {
  return (eyebrow && RULES.find((r) => r.match.test(eyebrow))?.tone) || 'ink';
}

export default function Card({ eyebrow, title, side, children, className, style, tone, image, imagePosition }: Props) {
  const t = tone ?? toneFor(eyebrow);
  return (
    <section className={clsx('almanac-card reveal', `tone-${t}`, image && 'has-photo', className)} style={style}>
      {image && (
        <div className="card-photo" aria-hidden>
          <img src={image} alt="" decoding="async" style={{ objectPosition: imagePosition ?? 'center' }} />
        </div>
      )}
      {(eyebrow || title || side) && (
        <header className="flex items-start justify-between gap-3 mb-4">
          <div className="min-w-0">
            {eyebrow && (
              <span className="tone-chip">
                <span className="tone-chip-icon" aria-hidden />
                {eyebrow}
              </span>
            )}
            {title && (
              <h3 className="font-display text-[1.6rem] leading-tight mt-1.5 font-normal tracking-[-0.01em]">
                {title}
              </h3>
            )}
          </div>
          {side && <div className="shrink-0 pt-0.5">{side}</div>}
        </header>
      )}
      <div>{children}</div>
    </section>
  );
}
