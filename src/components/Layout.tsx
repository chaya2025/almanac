import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { format } from 'date-fns';

const nav = [
  { to: '/', label: 'Today' },
  { to: '/trends', label: 'Trends' },
  { to: '/history', label: 'History' },
  { to: '/settings', label: 'Settings' },
];

export default function Layout() {
  const loc = useLocation();
  const dateStr = format(new Date(), "d MMM yyyy · EEE").toUpperCase();

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-rule">
        <div className="max-w-[1280px] mx-auto px-6 md:px-10 py-4 flex items-center justify-between gap-6">
          <div className="flex items-baseline gap-4">
            <NavLink to="/" className="font-display font-bold text-xl tracking-[0.32em] leading-none">
              ALMANAC
            </NavLink>
            <span className="hidden md:inline label">a chronicle of days</span>
          </div>

          <nav className="flex items-center gap-1">
            {nav.map((n) => {
              const active = loc.pathname === n.to;
              return (
                <NavLink
                  key={n.to}
                  to={n.to}
                  className={`px-3 py-1.5 text-xs uppercase tracking-[0.18em] font-medium border-b ${
                    active
                      ? 'text-clay-deep border-clay'
                      : 'text-ink-soft border-transparent hover:text-ink'
                  }`}
                >
                  {n.label}
                </NavLink>
              );
            })}
          </nav>

          <div className="hidden md:block label nums">{dateStr}</div>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-rule mt-12">
        <div className="max-w-[1280px] mx-auto px-6 md:px-10 py-6 flex items-center justify-between text-xs">
          <span className="label">Vol. I · Edition of {format(new Date(), 'yyyy')}</span>
          <span className="label">stored locally · yours alone</span>
        </div>
      </footer>
    </div>
  );
}
