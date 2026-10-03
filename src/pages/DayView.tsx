import { Link, Navigate, useParams } from 'react-router-dom';
import { format, parseISO, addDays, subDays, isValid } from 'date-fns';
import { prettyLongDate } from '@/lib/dates';
import { useTodayKey } from '@/lib/useTodayKey';
import Rule from '@/components/Rule';
import Today from './Today';

export default function DayView() {
  const today = useTodayKey();
  const { date = today } = useParams();

  // Bad or future dates go back to today
  if (!isValid(parseISO(date)) || date > today) return <Navigate to="/" replace />;
  if (date === today) return <Navigate to="/" replace />;

  const prev = format(subDays(parseISO(date), 1), 'yyyy-MM-dd');
  const next = format(addDays(parseISO(date), 1), 'yyyy-MM-dd');

  return (
    <div className="max-w-[1280px] mx-auto px-6 md:px-10 py-8">
      <nav className="reveal flex items-center justify-between mb-4">
        <Link to={`/day/${prev}`} className="btn-ghost">
          ← {format(parseISO(prev), 'EEE d MMM')}
        </Link>
        <Link to="/history" className="label hover:text-ink">↑ history</Link>
        {next < today ? (
          <Link to={`/day/${next}`} className="btn-ghost">
            {format(parseISO(next), 'EEE d MMM')} →
          </Link>
        ) : (
          <Link to="/" className="btn-ghost">today →</Link>
        )}
      </nav>

      <div className="reveal">
        <div className="label mb-3">{prettyLongDate(date)}</div>
        <h1 className="font-display font-normal text-[clamp(2.5rem,7vw,5.5rem)] leading-[0.95] tracking-tight">
          {format(parseISO(date), 'EEEE')},
          <br />
          <span className="font-display-italic text-clay-deep">
            the {format(parseISO(date), 'do')}
          </span>
          <span className="text-ink-soft"> of {format(parseISO(date), 'MMMM yyyy')}</span>
        </h1>
        <Rule />
      </div>

      <p className="reveal text-sm text-ink-soft -mt-2 mb-6">Fill in anything you missed. Changes save as you go.</p>

      <Today date={date} />
    </div>
  );
}
