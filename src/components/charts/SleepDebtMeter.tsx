import clsx from 'clsx';

type Props = {
  debt: number; // hours; negative = debt, positive = credit
  range?: number; // x-axis max (absolute), default 14h
};

export default function SleepDebtMeter({ debt, range = 14 }: Props) {
  const clamped = Math.max(-range, Math.min(range, debt));
  const pct = (clamped / range) * 50; // 0% at center
  const isCredit = clamped >= 0;
  const fill = isCredit
    ? 'linear-gradient(90deg, rgb(var(--leaf)), rgb(var(--aqua)))'
    : clamped > -2
      ? 'linear-gradient(270deg, rgb(var(--sun)), rgb(var(--amber)))'
      : 'linear-gradient(270deg, rgb(var(--amber)), rgb(var(--coral)))';
  const emoji = isCredit ? '😴' : clamped > -2 ? '🙂' : clamped > -6 ? '🥱' : '🧟';
  const label = isCredit
    ? `you’re ${debt.toFixed(1)}h ahead this week — well rested.`
    : Math.abs(debt) < 2
      ? `you’re ${Math.abs(debt).toFixed(1)}h short — nearly even.`
      : Math.abs(debt) < 6
        ? `${Math.abs(debt).toFixed(1)}h of sleep debt has built up.`
        : `${Math.abs(debt).toFixed(1)}h debt — a long night ahead would help.`;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-end justify-between">
        <span className={clsx('font-display font-black text-6xl leading-none nums', isCredit ? 'text-moss-deep' : clamped > -2 ? 'text-amber' : 'text-clay-deep')}>
          {debt >= 0 ? '+' : ''}
          {debt.toFixed(1)}
          <span className="text-2xl text-ink-mute ml-1">h</span>
        </span>
        <span className="flex items-center gap-2">
          <span className="text-4xl animate-float" aria-hidden>{emoji}</span>
          <span className="label nums">7-day window</span>
        </span>
      </div>

      <div className="relative h-7 rounded-full bg-tone-soft border-2 border-ink overflow-hidden">
        {/* fill */}
        <div
          className="absolute top-0 bottom-0 transition-all duration-700"
          style={{
            left: isCredit ? '50%' : `${50 + pct}%`,
            width: `${Math.abs(pct)}%`,
            background: fill,
          }}
        />
        {/* center tick */}
        <div className="absolute -top-1 -bottom-1 left-1/2 w-[3px] -translate-x-1/2 bg-ink" />
        {/* range ticks */}
        {[-1, -0.5, 0.5, 1].map((f) => (
          <div
            key={f}
            className="absolute top-0 bottom-0 w-px bg-ink/15"
            style={{ left: `${50 + f * 50}%` }}
          />
        ))}
      </div>

      <div className="flex justify-between text-[10px] uppercase tracking-[0.16em] font-bold text-ink-mute nums">
        <span>−{range}h debt</span>
        <span>0</span>
        <span>+{range}h credit</span>
      </div>

      <p className="text-sm text-ink-soft leading-relaxed border-t-2 border-ink/10 pt-3 italic">
        {label}
      </p>
    </div>
  );
}
