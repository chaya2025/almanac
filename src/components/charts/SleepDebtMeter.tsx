import clsx from 'clsx';

type Props = {
  debt: number; // hours; negative = debt, positive = credit
  range?: number; // x-axis max (absolute), default 14h
};

export default function SleepDebtMeter({ debt, range = 14 }: Props) {
  const clamped = Math.max(-range, Math.min(range, debt));
  const pct = (clamped / range) * 50; // 0% at center
  const isCredit = clamped >= 0;
  const tone = isCredit ? 'bg-moss' : clamped > -2 ? 'bg-amber' : 'bg-clay';
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
        <span className={clsx('font-display font-medium text-6xl leading-none nums', isCredit ? 'text-moss-deep' : clamped > -2 ? 'text-amber' : 'text-clay-deep')}>
          {debt >= 0 ? '+' : ''}
          {debt.toFixed(1)}
          <span className="text-2xl text-ink-mute ml-1">h</span>
        </span>
        <span className="label nums">7-day window</span>
      </div>

      <div className="relative h-4 bg-paper-2/60 border border-rule">
        {/* center tick */}
        <div className="absolute top-0 bottom-0 left-1/2 w-px bg-ink" />
        {/* fill */}
        <div
          className={clsx('absolute top-0 bottom-0', tone)}
          style={{
            left: isCredit ? '50%' : `${50 + pct}%`,
            width: `${Math.abs(pct)}%`,
          }}
        />
        {/* range ticks */}
        {[-1, -0.5, 0.5, 1].map((f) => (
          <div
            key={f}
            className="absolute top-0 bottom-0 w-px bg-rule"
            style={{ left: `${50 + f * 50}%` }}
          />
        ))}
      </div>

      <div className="flex justify-between text-[10px] uppercase tracking-[0.18em] text-ink-mute nums">
        <span>−{range}h debt</span>
        <span>0</span>
        <span>+{range}h credit</span>
      </div>

      <p className="text-sm text-ink-soft leading-relaxed border-t border-rule pt-3 italic">
        {label}
      </p>
    </div>
  );
}
