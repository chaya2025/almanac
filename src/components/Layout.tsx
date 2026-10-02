import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { format } from 'date-fns';
import clsx from 'clsx';

const nav = [
  { to: '/', label: 'Today', tone: 'tone-coral' },
  { to: '/trends', label: 'Trends', tone: 'tone-night' },
  { to: '/history', label: 'History', tone: 'tone-aqua' },
  { to: '/settings', label: 'Settings', tone: 'tone-sun' },
];

export default function Layout() {
  const loc = useLocation();
  const dateStr = format(new Date(), 'EEE d MMM');

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-30 px-3 md:px-6 pt-3">
        <div className="max-w-[1280px] mx-auto px-2.5 sm:px-4 md:px-6 py-2 sm:py-2.5 flex items-center justify-between gap-2 sm:gap-4 bg-white/85 backdrop-blur border-2 border-ink rounded-full shadow-pop">
          <NavLink to="/" className="flex items-center gap-2.5 shrink-0 group">
            <Logo />
            <span className="hidden sm:inline font-display font-black text-lg md:text-xl tracking-[0.14em] leading-none">
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
                    n.tone,
                    'px-2 sm:px-3 md:px-4 py-1.5 text-[10px] sm:text-[11px] md:text-xs uppercase tracking-[0.08em] sm:tracking-[0.14em] font-bold rounded-full border-2 transition-all whitespace-nowrap',
                    active
                      ? 'bg-tone border-ink shadow-pop-sm text-ink'
                      : 'border-transparent text-ink-soft hover:bg-tone-soft hover:text-ink'
                  )}
                >
                  {n.label}
                </NavLink>
              );
            })}
          </nav>

          <div className="hidden md:block text-xs font-bold nums text-ink-soft bg-sun/40 border-2 border-ink rounded-full px-3 py-1 shrink-0">
            {dateStr}
          </div>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="mt-12 pb-6 px-6">
        <div className="max-w-[1280px] mx-auto flex flex-wrap gap-2 items-center justify-between text-xs">
          <span className="label">Vol. I · {format(new Date(), 'yyyy')}</span>
          <span className="inline-flex items-center gap-1.5 label">
            <span className="h-2 w-2 rounded-full bg-leaf border border-ink" /> stored locally · yours alone
          </span>
        </div>
      </footer>
    </div>
  );
}

// Seven coloured petals, one per area of the day.
function Logo() {
  const colors = ['--night', '--tang', '--aqua', '--pink', '--leaf', '--sun', '--coral'];
  return (
    <svg width="30" height="30" viewBox="0 0 30 30" className="transition-transform duration-500 group-hover:rotate-[51deg]" aria-hidden>
      {colors.map((c, i) => {
        const a = (i / colors.length) * Math.PI * 2;
        return (
          <circle
            key={c}
            cx={15 + Math.cos(a) * 8}
            cy={15 + Math.sin(a) * 8}
            r={5.2}
            fill={`rgb(var(${c}))`}
            stroke="rgb(var(--ink))"
            strokeWidth={1.4}
          />
        );
      })}
      <circle cx="15" cy="15" r="4" fill="white" stroke="rgb(var(--ink))" strokeWidth={1.4} />
    </svg>
  );
}
