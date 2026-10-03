import { useEffect, useState } from 'react';
import { todayKey } from './dates';

/**
 * Today's date key (yyyy-MM-dd) that rolls over at midnight, so a tab left
 * open overnight starts writing to the new day instead of yesterday.
 */
export function useTodayKey(): string {
  const [key, setKey] = useState(todayKey);
  useEffect(() => {
    const tick = () => setKey((prev) => (prev === todayKey() ? prev : todayKey()));
    const t = setInterval(tick, 60_000);
    document.addEventListener('visibilitychange', tick);
    return () => {
      clearInterval(t);
      document.removeEventListener('visibilitychange', tick);
    };
  }, []);
  return key;
}
