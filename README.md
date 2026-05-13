# ALMANAC

> A local-first, editorial-style personal health almanac.
> Sleep · The Table · Water · Sport · Mood · Weight · Journal.

Built for Chayala. Everything stays in your browser unless you choose to export it.

---

## Run it

```powershell
npm install
npm run dev
```

Then open the URL Vite prints (usually http://localhost:5173).

To build a production bundle and preview it locally (this is what actually enables PWA install):

```powershell
npm run build
npm run preview
```

---

## What's inside

- **Today** — daily entry: sleep, meals (5 slots), water, sport, mood/energy/stress, weight, journal. Auto-saves to IndexedDB.
- **Trends** — daily / weekly / monthly charts for every metric, plus correlation cards.
- **History** — six-month mood heatmap. Click any square → that day's full chronicle.
- **Settings** — export / import JSON, install as a PWA, re-take quiz, wipe.

### Stack
React 18 · Vite · TypeScript · Tailwind · Dexie (IndexedDB) · Recharts · date-fns · Zod · vite-plugin-pwa

### Data
Lives in your browser's IndexedDB under the `almanac` database. **It does not leave this device.**
Back it up regularly from Settings → Export JSON (the file is named `chayala-almanac-YYYY-MM-DD.json`).

---

## Backing up the code

This folder is already a git repo with your first commit. To push it to the cloud:

### → GitHub (private — recommended)

1. Make a free account at https://github.com if you don't have one.
2. Install the GitHub CLI: https://cli.github.com (or use the web UI).
3. From this folder:

   ```powershell
   gh auth login                            # one-time, opens a browser
   gh repo create almanac --private --source=. --remote=origin --push
   ```

   Or without the CLI:
   - Create an empty repo on github.com (don't add a README).
   - Then:
     ```powershell
     git remote add origin https://github.com/<your-username>/almanac.git
     git push -u origin main
     ```

Every time you finish a change, run:

```powershell
git add .
git commit -m "what you changed"
git push
```

---

## Sharing the app (deploy to a free URL)

Once the repo is on GitHub, deploy is two clicks.

### → Vercel (recommended for Vite)

1. https://vercel.com → sign in with GitHub.
2. **Add New → Project** → pick your `almanac` repo → **Deploy**.
3. Vercel auto-detects Vite and gives you a URL like `chayala-almanac.vercel.app`.
4. Open that URL on any device — each device gets its own local data.

To use a custom domain, add it in Vercel → Settings → Domains.

### → Netlify / Cloudflare Pages

Same flow — both auto-detect Vite. Use whichever you prefer.

---

## Backing up your **data**

The code on GitHub does *not* back up your daily entries.
Your sleep, meals, water, sport, mood, weight, journal — all in IndexedDB on this device.

**Weekly habit:** Settings → **Export JSON** → drop the file in a synced folder (OneDrive / iCloud / Google Drive).
The app will remind you every 14 days if you forget.

To move to another device or restore: Settings → **Import JSON**, pick the file. Done.

---

## Personalisation

Greeting, exports and onboarding are themed to your name. To change:
Settings → re-take quiz → step "i. you".

---

## License

Personal use. Make it yours.
