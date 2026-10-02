import { useId } from 'react';

type Props = {
  value: number; // 0..1
  size?: number;
  stroke?: number;
  label?: string;
  caption?: string;
};

// A glass that fills with water: wavy liquid inside, a fat progress ring around it.
export default function ProgressRing({
  value,
  size = 128,
  stroke = 12,
  label,
  caption,
}: Props) {
  const id = useId().replace(/:/g, '');
  const clamped = Math.max(0, Math.min(1, value));
  const r = (size - stroke) / 2 - 2;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - clamped);
  const inner = r - stroke / 2 - 4;
  const cx = size / 2;
  // liquid surface height inside the inner circle
  const top = cx + inner - clamped * inner * 2;
  const done = clamped >= 1;

  return (
    <div className="relative inline-block" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <defs>
          <clipPath id={`glass-${id}`}>
            <circle cx={cx} cy={cx} r={inner} />
          </clipPath>
          <linearGradient id={`ring-${id}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="rgb(var(--tone))" />
            <stop offset="100%" stopColor="rgb(var(--night))" />
          </linearGradient>
        </defs>

        {/* liquid */}
        <circle cx={cx} cy={cx} r={inner} fill="rgb(var(--tone-soft))" />
        <g clipPath={`url(#glass-${id})`}>
          <g style={{ transform: `translateY(${top}px)`, transition: 'transform 0.9s cubic-bezier(0.2,0.7,0.2,1)' }}>
            <path
              d={wave(size * 2, 7)}
              fill="rgb(var(--tone) / 0.45)"
              style={{ animation: 'almanacWave 3.2s linear infinite' }}
            />
            <path
              d={wave(size * 2, 5)}
              fill="rgb(var(--tone) / 0.85)"
              transform="translate(0 4)"
              style={{ animation: 'almanacWave 2.2s linear infinite reverse' }}
            />
          </g>
        </g>
        <circle cx={cx} cy={cx} r={inner} fill="none" stroke="rgb(var(--ink))" strokeWidth={2} />

        {/* ring */}
        <circle cx={cx} cy={cx} r={r} fill="none" stroke="rgb(var(--ink) / 0.08)" strokeWidth={stroke} />
        <circle
          cx={cx}
          cy={cx}
          r={r}
          fill="none"
          stroke={`url(#ring-${id})`}
          strokeWidth={stroke}
          strokeDasharray={c}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${cx} ${cx})`}
          style={{ transition: 'stroke-dashoffset 0.9s cubic-bezier(0.2,0.7,0.2,1)' }}
        />
      </svg>
      <style>{`@keyframes almanacWave { from { transform: translateX(0); } to { transform: translateX(-${size}px); } }`}</style>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {label && (
          <div className="font-display font-black text-3xl leading-none nums drop-shadow-[0_1px_0_white]">
            {label}
          </div>
        )}
        {caption && <div className="label mt-1 !text-ink-soft">{done ? 'goal hit ✓' : caption}</div>}
      </div>
    </div>
  );
}

// A strip of sine wave, twice as wide as the glass so it can scroll seamlessly.
function wave(width: number, amp: number) {
  const period = width / 4;
  let d = `M 0 0`;
  for (let x = 0; x <= width; x += period / 2) {
    const up = (x / (period / 2)) % 2 === 0;
    d += ` Q ${x + period / 4} ${up ? -amp : amp} ${x + period / 2} 0`;
  }
  return `${d} L ${width} 400 L 0 400 Z`;
}
