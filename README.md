# ALMANAC

A local-first personal health tracker. Log sleep, meals, water, exercise, mood, weight, and a
daily journal. Everything stays in your browser.

**Live:** https://almanac-iota.vercel.app

## Why local-first

All data lives in the browser's IndexedDB via Dexie. There is no server and no account, so there
is nothing to breach and nothing to host. The app works offline and installs as a PWA. Backup is
an explicit JSON export you control, which also moves your data between devices.

## What's inside

- **Today** — daily entry across sleep, meals (5 slots), water, sport, mood/energy/stress, weight,
  and journal. Auto-saves to IndexedDB.
- **Trends** — daily, weekly, and monthly charts for every metric, plus correlation cards.
- **History** — six-month mood heatmap; click any day to open its full entry.
- **Settings** — Zod-validated JSON export/import, PWA install, reset.

## Stack

React 18 · TypeScript · Vite · Tailwind · Dexie (IndexedDB) · Recharts · Zod · vite-plugin-pwa

## Run it

```bash
npm install
npm run dev
```

Production build (enables PWA install):

```bash
npm run build
npm run preview
```
