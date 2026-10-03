# ALMANAC

A local-first personal health tracker. Log sleep, meals, water, exercise, mood, weight and a
daily journal. Everything stays in your browser.

**Live:** https://almanac-iota.vercel.app

## How it works

```
 your browser                                     Vercel (static files only)
┌───────────────────────────────────────┐        ┌────────────────────────────┐
│ React app  ──reads/writes──▶ IndexedDB │ ◀──────│ index.html, JS, CSS, photos │
│ (Dexie)          "almanac" database    │  once  └────────────────────────────┘
│ service worker caches the app offline │              ▲ redeploys on every
└───────────────────────────────────────┘              │ push to main (GitHub)
```

- **Where the data lives:** in the browser's IndexedDB, in a database called `almanac`, on the
  device you use. There is no server, no account and no database in the cloud. Your phone and
  your laptop each have their own separate copy.
- **What Vercel does:** serves the app's files (HTML, JavaScript, CSS, images). It never sees your
  entries. Vercel is connected to this GitHub repo and rebuilds the site on every push to `main`.
- **Offline:** a service worker (vite-plugin-pwa) caches the app, so it opens without internet and
  can be installed to the home screen.
- **Keeping data safe:** on start the app asks the browser for *persistent storage*, so the browser
  won't clear your entries to free up space. Settings shows whether that's granted.
- **Backup and moving devices:** Settings → Export downloads one JSON file with everything. Import
  checks the file (Zod schema) and then **replaces** all data on that device in one transaction,
  so a bad file changes nothing. It replaces rather than merges because entry ids are per device.

## Data model (`src/db/schema.ts`)

| Table | One row per | Key |
|---|---|---|
| `profile` | you (targets, diet style, name) | `'me'` |
| `days` | day: mood, energy, stress, journal | date |
| `sleep` | night: bedtime, wake time, hours, quality | auto id, indexed by date |
| `meals` | meal slot per day, with food items | auto id, `[date+slot]` |
| `water` | each glass added | auto id |
| `workouts` | each session | auto id |
| `weights` | weigh-in | auto id, unique date |
| `foodLibrary` | known food (seeded + ones you add) | auto id, unique name |
| `savedMeals` | cookbook template | auto id |

Dates are local `yyyy-MM-dd` strings. `feedback` exists in the schema from v1 but is unused.

## Pages

- **Today** — the day sheet: sleep, meals (5 slots), water, sport, mood/energy/stress, weight and
  journal. Saves as you type.
- **History** — six-month mood heatmap. Any past day opens the same editable day sheet, so a
  missed day can be filled in later.
- **Trends** — daily, weekly and monthly charts, sleep debt, and patterns (correlations need at
  least 10 paired days before they show). Loaded on demand because it carries the chart library.
- **Settings** — profile, export/import, storage protection, install, erase.

## Stack

React 18 · TypeScript · Vite · Tailwind · Dexie (IndexedDB) · Recharts · Zod · vite-plugin-pwa

## Run it

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # production build into dist/
npm run preview    # serve the build (PWA install works here)
```

Photos are from Unsplash (free to use under the Unsplash License) and are bundled in
`public/images`, so the app never loads anything from Unsplash at runtime.
