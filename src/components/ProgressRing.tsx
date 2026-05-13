type Props = {
  value: number; // 0..1
  size?: number;
  stroke?: number;
  label?: string;
  caption?: string;
};

export default function ProgressRing({
  value,
  size = 128,
  stroke = 6,
  label,
  caption,
}: Props) {
  const clamped = Math.max(0, Math.min(1, value));
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - clamped);

  return (
    <div className="relative inline-block" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="rgb(var(--rule))"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="rgb(var(--ink))"
          strokeWidth={stroke}
          strokeDasharray={c}
          strokeDashoffset={offset}
          strokeLinecap="butt"
          style={{ transition: 'stroke-dashoffset 0.6s cubic-bezier(0.2,0.7,0.2,1)' }}
        />
        {/* tick marks at 0, 25, 50, 75 */}
        {[0, 0.25, 0.5, 0.75].map((p) => {
          const angle = p * 2 * Math.PI - Math.PI / 2;
          const x1 = size / 2 + Math.cos(angle) * (r + stroke / 2 + 2);
          const y1 = size / 2 + Math.sin(angle) * (r + stroke / 2 + 2);
          const x2 = size / 2 + Math.cos(angle) * (r + stroke / 2 + 6);
          const y2 = size / 2 + Math.sin(angle) * (r + stroke / 2 + 6);
          return (
            <line
              key={p}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="rgb(var(--ink-mute))"
              strokeWidth={1}
            />
          );
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {label && (
          <div className="font-display font-medium text-3xl leading-none nums">
            {label}
          </div>
        )}
        {caption && <div className="label mt-1">{caption}</div>}
      </div>
    </div>
  );
}
