import { lazy, Suspense, useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import Layout from './components/Layout';
import Today from './pages/Today';
import Onboarding from './pages/Onboarding';
import History from './pages/History';
import Settings from './pages/Settings';
import DayView from './pages/DayView';
import { db } from './db/schema';
import { seedFoodLibrary } from './db/seed';
import { requestPersistentStorage } from './lib/storage';

// Trends carries the charting library (most of the bundle), so it loads on first visit
const Trends = lazy(() => import('./pages/Trends'));

export default function App() {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        await db.open();
        await seedFoodLibrary();
        void requestPersistentStorage();
        setReady(true);
      } catch (e) {
        setError((e as Error).message || 'unknown error');
      }
    })();
  }, []);

  // Live, so finishing onboarding, importing a backup or erasing everything
  // all route correctly without a reload.
  const profile = useLiveQuery(async () => {
    if (!ready) return undefined;
    return (await db.profile.get('me')) ?? null;
  }, [ready]);

  if (error) return <StorageError message={error} />;

  if (!ready || profile === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="label">opening the almanac…</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <Routes>
        <Route path="/onboarding" element={<Onboarding onComplete={() => {}} />} />
        <Route path="*" element={<Navigate to="/onboarding" replace />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route path="/onboarding" element={<Navigate to="/" replace />} />
      <Route element={<Layout />}>
        <Route path="/" element={<Today />} />
        <Route
          path="/trends"
          element={
            <Suspense fallback={<div className="py-24 text-center label">loading charts…</div>}>
              <Trends />
            </Suspense>
          }
        />
        <Route path="/history" element={<History />} />
        <Route path="/day/:date" element={<DayView />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

function StorageError({ message }: { message: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="almanac-card max-w-md">
        <div className="label">storage unavailable</div>
        <h1 className="font-display text-2xl mt-2">Almanac can’t open its storage</h1>
        <p className="text-sm text-ink-soft mt-3 leading-relaxed">
          Your entries live in this browser’s storage, and the browser refused access. This usually
          happens in a private window or when site data is blocked. Open Almanac in a normal window,
          or allow site data for this address.
        </p>
        <p className="text-xs text-ink-mute mt-3 font-mono">{message}</p>
      </div>
    </div>
  );
}
