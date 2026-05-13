import { useEffect, useMemo, useRef, useState } from 'react';
import clsx from 'clsx';
import type { MealEntry, MealItem, FoodGroup, FoodLibraryEntry } from '@/types';

type Props = {
  label: string;
  meal?: MealEntry;
  library: FoodLibraryEntry[];
  score: number;
  onChange: (items: MealItem[]) => void;
};

const groupGlyph: Record<FoodGroup, string> = {
  protein: 'P',
  veg: 'V',
  fruit: 'F',
  grain: 'G',
  dairy: 'D',
  fat: '○',
  sweet: 'S',
  drink: '~',
};

const groupClass: Record<FoodGroup, string> = {
  protein: 'border-clay text-clay-deep',
  veg: 'border-moss text-moss-deep',
  fruit: 'border-moss text-moss-deep',
  grain: 'border-amber text-amber',
  dairy: 'border-ink-mute text-ink-soft',
  fat: 'border-ink-mute text-ink-soft',
  sweet: 'border-clay text-clay-deep',
  drink: 'border-ink-mute text-ink-soft',
};

export default function MealRow({ label, meal, library, score, onChange }: Props) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const items = meal?.items ?? [];

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return library.slice(0, 8);
    return library
      .filter((f) => f.name.toLowerCase().includes(q))
      .slice(0, 8);
  }, [query, library]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const addItem = (food: FoodLibraryEntry) => {
    onChange([...items, { name: food.name, group: food.group, qty: 1 }]);
    setQuery('');
    inputRef.current?.focus();
  };

  const addFreeform = () => {
    const name = query.trim();
    if (!name) return;
    onChange([...items, { name, group: 'protein', qty: 1 }]); // user can recat later
    setQuery('');
  };

  const removeItem = (i: number) => {
    onChange(items.filter((_, idx) => idx !== i));
  };

  return (
    <div ref={containerRef} className="py-3 border-b border-rule last:border-b-0">
      <div className="flex items-baseline justify-between gap-3 mb-2">
        <div className="flex items-baseline gap-3">
          <span className="font-display text-lg font-medium leading-none">{label}</span>
          <span className="label">{items.length ? `${items.length} item${items.length > 1 ? 's' : ''}` : '—'}</span>
        </div>
        <ScoreChip score={items.length ? score : null} />
      </div>

      {items.length > 0 && (
        <ul className="flex flex-wrap gap-1.5 mb-2">
          {items.map((it, i) => (
            <li
              key={i}
              className={clsx(
                'group inline-flex items-center gap-1.5 px-2 py-1 text-[12px] border rounded-sm bg-paper/60',
                groupClass[it.group]
              )}
            >
              <span className="font-mono text-[10px] opacity-70">{groupGlyph[it.group]}</span>
              <span className="text-ink">{it.name}</span>
              <button
                aria-label={`Remove ${it.name}`}
                onClick={() => removeItem(i)}
                className="opacity-0 group-hover:opacity-100 transition-opacity text-ink-mute hover:text-clay ml-1"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="relative">
        <input
          ref={inputRef}
          className="field"
          placeholder={items.length ? 'add another…' : 'add what you ate…'}
          value={query}
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              if (matches[0]) addItem(matches[0]);
              else addFreeform();
            }
            if (e.key === 'Escape') setOpen(false);
          }}
        />
        {open && (
          <div className="absolute z-10 left-0 right-0 top-full mt-1 bg-paper border border-ink/30 max-h-64 overflow-auto shadow-[0_8px_30px_rgba(0,0,0,0.08)]">
            {matches.map((f) => (
              <button
                key={f.id ?? f.name}
                onClick={() => addItem(f)}
                className="w-full text-left flex items-center justify-between px-3 py-2 hover:bg-paper-2 border-b border-rule last:border-b-0"
              >
                <span className="flex items-center gap-2">
                  <span className={clsx('font-mono text-[10px] inline-flex items-center justify-center h-4 w-4 border', groupClass[f.group])}>
                    {groupGlyph[f.group]}
                  </span>
                  <span className="text-sm">{f.name}</span>
                </span>
                <span className="label">{f.group}</span>
              </button>
            ))}
            {query.trim() && !matches.find((m) => m.name.toLowerCase() === query.trim().toLowerCase()) && (
              <button
                onClick={addFreeform}
                className="w-full text-left px-3 py-2 hover:bg-paper-2 text-sm italic text-ink-soft"
              >
                + add “{query.trim()}” as new food
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function ScoreChip({ score }: { score: number | null }) {
  if (score == null) return <span className="text-ink-mute text-xs">—</span>;
  const tone =
    score >= 75 ? 'text-moss-deep border-moss' :
    score >= 50 ? 'text-amber border-amber' :
    'text-clay-deep border-clay';
  return (
    <span className={clsx('inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] uppercase tracking-[0.15em] border rounded-sm bg-paper nums', tone)}>
      {score}
    </span>
  );
}
