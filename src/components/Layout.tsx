import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { format } from 'date-fns';
import clsx from 'clsx';

const nav = [
  { to: '/', label: 'Today' },
  { to: '/trends', label: 'Trends' },
  { to: '/history', label: 'History' },
  { to: '/settings', label: 'Settings' },
];

export default function Layout() {
  const loc = useLocation();
  const dateStr = format(new Date(), 'EEE d MMM');

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-30 bg-paper/80 backdrop-blur-md border-b border-rule">
        <div className="max-w-[1280px] mx-auto px-4 md:px-10 h-14 flex items-center justify-between gap-4">
          <NavLink to="/" className="flex items-center gap-2.5 shrink-0">
            <Mark />
            <span className="hidden sm:inline font-display text-lg tracking-[0.22em] leading-none">
              ALMANAC
            </span>
          </NavLink>

          <nav className="flex items-center gap-0.5 sm:gap-1 min-w-0">
            {nav.map((n) => {
              const active = loc.pathname === n.to;
              return (
                <NavLink
                  key={n.to}
                  to={n.to}
                  className={clsx(
                    'relative px-2.5 sm:px-3.5 py-1.5 text-[13px] rounded-lg transition-colors whitespace-nowrap',
                    active ? 'text-ink font-medium bg-white shadow-[0_1px_2px_rgb(28_30_36/0.06)] ring-1 ring-rule' : 'text-ink-mute hover:text-ink'
                  )}
                >
                  {n.label}
                </NavLink>
              );
            })}
          </nav>

          <div className="hidden md:block text-[13px] nums text-ink-mute shrink-0">{dateStr}</div>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-rule mt-16">
        <div className="max-w-[1280px] mx-auto px-6 md:px-10 py-6 flex flex-wrap gap-2 items-center justify-between">
          <span className="label">Almanac · {format(new Date(), 'yyyy')}</span>
          <span className="label">stored on this device only</span>
        </div>
      </footer>
    </div>
  );
}

// Seven thin arcs, one per area of the day, closing into a ring.
function Mark() {
  const colors = ['--night', '--tang', '--aqua', '--pink', '--leaf', '--sun', '--coral'];
  const r = 9;
  const c = 2 * Math.PI * r;
  const seg = c / colors.length;
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden className="-rotate-90">
      {colors.map((col, i) => (
        <circle
          key={col}
          cx="12"
          cy="12"
          r={r}
          fill="none"
          stroke={`rgb(var(${col}))`}
          strokeWidth="3"
          strokeDasharray={`${seg - 1.6} ${c - seg + 1.6}`}
          strokeDashoffset={-i * seg}
        />
      ))}
    </svg>
  );
}
