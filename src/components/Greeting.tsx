import { useEffect, useState } from 'react';

const phraseFor = (h: number): string => {
  if (h < 5) return 'Up late,';
  if (h < 12) return 'Good morning,';
  if (h < 17) return 'Good afternoon,';
  if (h < 21) return 'Good evening,';
  return 'Tonight,';
};

export default function Greeting({ name }: { name?: string }) {
  const [hour, setHour] = useState(() => new Date().getHours());
  useEffect(() => {
    const t = setInterval(() => setHour(new Date().getHours()), 60_000);
    return () => clearInterval(t);
  }, []);
  const greeting = phraseFor(hour);
  const display = name?.trim() || 'friend';
  return (
    <div className="font-display text-xl md:text-2xl text-ink-soft mb-2 reveal">
      {greeting}{' '}
      <span className="font-display-italic text-clay-deep">{display}</span>.
    </div>
  );
}
