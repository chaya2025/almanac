import { useEffect, useMemo, useRef, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import clsx from 'clsx';
import { db } from '@/db/schema';
import type { MealEntry, MealItem, FoodGroup, FoodLibraryEntry } from '@/types';

type Props = {
  label: string;
  meal?: MealEntry;
  library: FoodLibraryEntry[];
  score: number;
  onChange: (items: MealItem[]) => void;
};

const ALL_GROUPS: FoodGroup[] = ['protein', 'veg', 'fruit', 'grain', 'dairy', 'fat', 'sweet', 'drink'];

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

const LAST_GROUP_KEY = 'almanac:lastGroup';

export default function MealRow({ label, meal, library, score, onChange }: Props) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [groupPickerFor, setGroupPickerFor] = useState<string | null>(null);
  const [savingName, setSavingName] = useState<string>('');
  const [showSavedList, setShowSavedList] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const savedMeals = useLiveQuery(() => db.savedMeals.orderBy('name').toArray(), []);

  const items = meal?.items ?? [];

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return library.slice(0, 8);
    return library
      .filter((f) => f.name.toLowerCase().includes(q))
      .slice(0, 8);
  }, [query, library]);

  const exactMatch = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return null;
    return library.find((f) => f.name.toLowerCase() === q) ?? null;
  }, [query, library]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) {
        setOpen(false);
        setGroupPickerFor(null);
        setShowSavedList(false);
      }
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const lastUsedGroup = (): FoodGroup => {
    try {
      const v = localStorage.getItem(LAST_GROUP_KEY) as FoodGroup | null;
      if (v && ALL_GROUPS.includes(v)) return v;
    } catch {}
    return 'protein';
  };

  const rememberGroup = (g: FoodGroup) => {
    try { localStorage.setItem(LAST_GROUP_KEY, g); } catch {}
  };

  const addItem = (food: FoodLibraryEntry) => {
    onChange([...items, { name: food.name, group: food.group, qty: 1 }]);
    setQuery('');
    setGroupPickerFor(null);
    inputRef.current?.focus();
  };

  // Save to library + add to meal in one step
  const saveAndAdd = async (name: string, group: FoodGroup) => {
    rememberGroup(group);
    try {
      await db.foodLibrary.add({ name, group, tags: ['user-added'] });
    } catch {
      // unique-name index threw — already exists; safe to ignore
    }
    onChange([...items, { name, group, qty: 1 }]);
    setQuery('');
    setGroupPickerFor(null);
    inputRef.current?.focus();
  };

  const removeItem = (i: number) => {
    onChange(items.filter((_, idx) => idx !== i));
  };

  const saveTemplate = async () => {
    const name = savingName.trim();
    if (!name || items.length === 0) return;
    try {
      await db.savedMeals.add({ name, items, slotHint: meal?.slot, createdAt: Date.now() });
    } catch {
      alert('A saved meal with that name already exists.');
      return;
    }
    setSavingName('');
  };

  const loadTemplate = (templateItems: MealItem[]) => {
    onChange([...items, ...templateItems]);
    setShowSavedList(false);
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
            setGroupPickerFor(null);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              if (exactMatch) {
                addItem(exactMatch);
              } else if (matches[0] && !query.trim()) {
                addItem(matches[0]);
              } else if (query.trim()) {
                // Enter on a new food → save with last-used group
                saveAndAdd(query.trim(), lastUsedGroup());
              }
            }
            if (e.key === 'Escape') {
              setOpen(false);
              setGroupPickerFor(null);
            }
          }}
        />
        {open && (
          <div className="absolute z-10 left-0 right-0 top-full mt-1 bg-paper border border-ink/30 max-h-72 overflow-auto shadow-[0_8px_30px_rgba(0,0,0,0.08)]">
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
            {query.trim() && !exactMatch && (
              groupPickerFor === query.trim() ? (
                <div className="px-3 py-3 border-t border-rule bg-paper-2/40">
                  <div className="label mb-2">
                    save “{query.trim()}” as:
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {ALL_GROUPS.map((g) => (
                      <button
                        key={g}
                        onClick={() => saveAndAdd(query.trim(), g)}
                        className={clsx(
                          'px-2 py-1 text-[11px] uppercase tracking-[0.12em] border rounded-sm bg-paper hover:bg-paper-2 transition-colors',
                          groupClass[g]
                        )}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => setGroupPickerFor(null)}
                    className="mt-2 text-[10px] uppercase tracking-[0.18em] text-ink-mute hover:text-ink"
                  >
                    cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setGroupPickerFor(query.trim())}
                  className="w-full text-left px-3 py-2 hover:bg-paper-2 text-sm italic text-clay-deep border-t border-rule"
                >
                  + add “{query.trim()}” to your library
                </button>
              )
            )}
          </div>
        )}
      </div>

      {/* Saved-meal actions */}
      <div className="flex items-center gap-3 mt-2 text-[10px] uppercase tracking-[0.18em]">
        {items.length > 0 ? (
          savingName !== '' || savingName === '' ? (
            <SaveAsControl
              name={savingName}
              setName={setSavingName}
              onSave={saveTemplate}
            />
          ) : null
        ) : (savedMeals?.length ?? 0) > 0 ? (
          <div className="relative">
            <button
              onClick={() => setShowSavedList((s) => !s)}
              className="text-ink-mute hover:text-ink"
            >
              ↺ load saved meal
            </button>
            {showSavedList && (
              <div className="absolute z-10 left-0 top-full mt-1 bg-paper border border-ink/30 min-w-[220px] max-h-60 overflow-auto shadow-[0_8px_30px_rgba(0,0,0,0.08)]">
                {(savedMeals ?? []).map((m) => (
                  <button
                    key={m.id}
                    onClick={() => loadTemplate(m.items)}
                    className="w-full text-left px-3 py-2 hover:bg-paper-2 border-b border-rule last:border-b-0"
                  >
                    <div className="font-display text-sm">{m.name}</div>
                    <div className="label">{m.items.length} item{m.items.length === 1 ? '' : 's'}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function SaveAsControl({
  name,
  setName,
  onSave,
}: {
  name: string;
  setName: (v: string) => void;
  onSave: () => void;
}) {
  const [open, setOpen] = useState(false);
  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-ink-mute hover:text-ink"
      >
        ✎ save as template
      </button>
    );
  }
  return (
    <div className="flex items-center gap-2">
      <input
        autoFocus
        type="text"
        placeholder="name this meal…"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            onSave();
            setOpen(false);
          }
          if (e.key === 'Escape') setOpen(false);
        }}
        className="text-xs px-2 py-1 border border-rule bg-paper outline-none focus:border-ink"
      />
      <button
        onClick={() => { onSave(); setOpen(false); }}
        disabled={!name.trim()}
        className="text-ink-mute hover:text-ink disabled:opacity-50"
      >
        save
      </button>
      <button onClick={() => setOpen(false)} className="text-ink-mute hover:text-ink">
        cancel
      </button>
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
