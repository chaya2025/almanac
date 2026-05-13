import { ReactNode } from 'react';
import clsx from 'clsx';

type Props = {
  eyebrow?: string;
  title?: string;
  side?: ReactNode;
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
};

export default function Card({ eyebrow, title, side, children, className, style }: Props) {
  return (
    <section className={clsx('almanac-card reveal', className)} style={style}>
      {(eyebrow || title || side) && (
        <header className="flex items-start justify-between gap-3 mb-3">
          <div className="min-w-0">
            {eyebrow && <div className="label">{eyebrow}</div>}
            {title && (
              <h3 className="font-display text-2xl leading-tight mt-1 font-medium">
                {title}
              </h3>
            )}
          </div>
          {side && <div className="shrink-0">{side}</div>}
        </header>
      )}
      <div>{children}</div>
    </section>
  );
}
