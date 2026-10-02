type Props = { label?: string; className?: string };

export default function Rule({ label, className }: Props) {
  if (!label) {
    return <hr className={`hr my-6 ${className ?? ''}`} />;
  }
  return (
    <div className={`flex items-center gap-4 my-8 ${className ?? ''}`}>
      <span className="flex-1 h-px bg-rule" />
      <span className="label">{label}</span>
      <span className="flex-1 h-px bg-rule" />
    </div>
  );
}
