import { useId } from 'react';

type Props = {
  value: number; // 0..1
  size?: number;
  stroke?: number;
  label?: string;
  caption?: string;
};

// A progress ring around a quiet tinted fill that rises with the value.
export default function ProgressRing({
  value,
  size = 128,
  stroke = 6,
  label,
  caption,
}: Props) {
  const id = useId().replace(/:/g, '');
  const clamped = Math.max(0, Math.min(1, value));
  const cx = size / 2;
  const r = cx - stroke / 2 - 1;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - clamped);
  const inner = r - stroke / 2 - 6;
  const level = cx + inner - clamped * inner * 2;

  return (
    <div className="relative inline-block" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <defs>
          <clipPath id={`fill-${id}`}>
            <circle cx={cx} cy={cx} r={inner} />
          </clipPath>
          <linearGradient id={`liquid-${id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgb(var(--tone))" stopOpacity="0.3" />
            <stop offset="100%" stopColor="rgb(var(--tone))" stopOpacity="0.16" />
          </linearGradient>
        </defs>

        <circle cx={cx} cy={cx} r={inner} fill="rgb(var(--paper))" />
        <g clipPath={`url(#fill-${id})`}>
          <rect
            x="0"
            width={size}
            height={size}
            fill={`url(#liquid-${id})`}
            style={{ transform: `translateY(${level}px)`, transition: 'transform 0.9s cubic-bezier(0.2,0.7,0.2,1)' }}
          />
          <line
            x1="0"
            x2={size}
            y1="0"
            y2="0"
            stroke="rgb(var(--tone))"
            strokeOpacity="0.45"
            strokeWidth="1"
            style={{ transform: `translateY(${level}px)`, transition: 'transform 0.9s cubic-bezier(0.2,0.7,0.2,1)' }}
          />
        </g>

        <circle cx={cx} cy={cx} r={r} fill="none" stroke="rgb(var(--paper-3))" strokeWidth={stroke} />
        <circle
          cx={cx}
          cy={cx}
          r={r}
          fill="none"
          stroke="rgb(var(--tone))"
          strokeWidth={stroke}
          strokeDasharray={c}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${cx} ${cx})`}
          style={{ transition: 'stroke-dashoffset 0.9s cubic-bezier(0.2,0.7,0.2,1)' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {label && <div className="font-display text-3xl leading-none nums">{label}</div>}
        {caption && <div className="label mt-1.5">{clamped >= 1 ? 'goal reached' : caption}</div>}
      </div>
    </div>
  );
}
