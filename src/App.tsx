import { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Today from './pages/Today';
import Onboarding from './pages/Onboarding';
import Trends from './pages/Trends';
import History from './pages/History';
import Settings from './pages/Settings';
import DayView from './pages/DayView';
import { db } from './db/schema';
import { seedFoodLibrary } from './db/seed';

export default function App() {
  const [ready, setReady] = useState(false);
  const [hasProfile, setHasProfile] = useState(false);

  useEffect(() => {
    (async () => {
      await db.open();
      await seedFoodLibrary();
      const profile = await db.profile.get('me');
      setHasProfile(!!profile);
      setReady(true);
    })();
  }, []);

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="label">opening the almanac…</div>
      </div>
    );
  }

  return (
    <Routes>
      <Route
        path="/onboarding"
        element={<Onboarding onComplete={() => setHasProfile(true)} />}
      />
      <Route element={<Layout />}>
        <Route
          path="/"
          element={hasProfile ? <Today /> : <Navigate to="/onboarding" replace />}
        />
        <Route path="/trends" element={<Trends />} />
        <Route path="/history" element={<History />} />
        <Route path="/day/:date" element={<DayView />} />
        <Route path="/settings" element={<Settings />} />
      </Route>
    </Routes>
  );
}
