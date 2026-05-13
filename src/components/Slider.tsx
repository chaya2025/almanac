type Props = {
  label: string;
  value: number;
  onChange: (n: number) => void;
  min?: number;
  max?: number;
  step?: number;
  scaleLeft?: string;
  scaleRight?: string;
};

export default function Slider({
  label,
  value,
  onChange,
  min = 1,
  max = 5,
  step = 1,
  scaleLeft,
  scaleRight,
}: Props) {
  return (
    <div>
      <div className="flex items-baseline justify-between mb-1">
        <span className="label">{label}</span>
        <span className="font-display text-2xl leading-none nums">
          {value}
          <span className="text-ink-mute text-base">/{max}</span>
        </span>
      </div>
      <input
        type="range"
        className="almanac"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      {(scaleLeft || scaleRight) && (
        <div className="flex justify-between text-[10px] uppercase tracking-[0.18em] text-ink-mute mt-1">
          <span>{scaleLeft}</span>
          <span>{scaleRight}</span>
        </div>
      )}
    </div>
  );
}
