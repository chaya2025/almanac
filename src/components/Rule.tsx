type Props = { label?: string; className?: string };

export default function Rule({ label, className }: Props) {
  if (!label) {
    return <hr className={`hr my-6 ${className ?? ''}`} />;
  }
  return (
    <div className={`flex items-center gap-4 my-8 ${className ?? ''}`}>
      <span className="flex-1 h-[2px] rounded bg-ink/10" />
      <span className="text-[11px] uppercase tracking-[0.18em] font-extrabold px-3 py-1 rounded-full border-2 border-ink bg-sun shadow-pop-sm">{label}</span>
      <span className="flex-1 h-[2px] rounded bg-ink/10" />
    </div>
  );
}
