type Props = {
  label: string;
  value: number;
  onChange: (n: number) => void;
  min?: number;
  max?: number;
  step?: number;
  scaleLeft?: string;
  scaleRight?: string;
  faces?: string[]; // one glyph per step, shown next to the value
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
  faces,
}: Props) {
  const fill = ((value - min) / (max - min)) * 100;
  const face = faces?.[Math.round(value - min)];
  return (
    <div>
      <div className="flex items-baseline justify-between mb-1">
        <span className="label">{label}</span>
        <span className="flex items-baseline gap-2">
          {face && (
            <span key={face} className="text-xl leading-none inline-block animate-wiggle" aria-hidden>
              {face}
            </span>
          )}
          <span className="font-display font-black text-2xl leading-none nums">
            {value}
            <span className="text-ink-mute text-base font-medium">/{max}</span>
          </span>
        </span>
      </div>
      <input
        type="range"
        className="almanac"
        min={min}
        max={max}
        step={step}
        value={value}
        style={{ ['--fill' as string]: `${fill}%` }}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      {(scaleLeft || scaleRight) && (
        <div className="flex justify-between text-[10px] uppercase tracking-[0.16em] font-bold text-ink-mute mt-0.5">
          <span>{scaleLeft}</span>
          <span>{scaleRight}</span>
        </div>
      )}
    </div>
  );
}
