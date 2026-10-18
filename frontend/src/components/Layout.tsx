import { NavLink, Outlet, useLocation, Link } from 'react-router-dom';
import { useEffect } from 'react';
import { siteConfig } from '@/config';
import { useIsAdmin, useLogout } from '@/api/hooks';
import { useBrowserReminders } from '@/hooks/useBrowserReminders';
import { useDueItems } from '@/hooks/useDueItems';
import { useNow } from '@/hooks/useNow';
import { useSubjectMap } from '@/hooks/useSubjectMap';
import { useReminders } from '@/store/reminders';
import { useUi } from '@/store/ui';
import { dayDiff, dayKey } from '@/utils/date';
import { AdminHost } from './admin/AdminHost';
import { BellButton } from './BellButton';
import { ConfirmHost } from './ConfirmHost';
import { QuickAdd } from './QuickAdd';
import { SearchPalette } from './SearchPalette';
import { ThemePicker } from './ThemePicker';
import { Toasts } from './ui/Toasts';

const NAV = [
  { to: '/', label: 'Home', emoji: '🏠', end: true, mobile: true },
  { to: '/tasks', label: 'Tasks', emoji: '📋', mobile: true },
  { to: '/performance-tasks', label: 'Performance', emoji: '🎯', mobile: true },
  { to: '/reviewers', label: 'Reviewers', emoji: '📚', mobile: true },
  { to: '/calendar', label: 'Calendar', emoji: '🗓️', mobile: true },
  { to: '/events', label: 'Events', emoji: '🎉', mobile: true },
  { to: '/announcements', label: 'Announcements', emoji: '📢', mobile: false },
];

function ReminderBanner() {
  const now = useNow();
  const { due, overdue } = useDueItems(now, 1);
  const { map } = useSubjectMap();
  const dismissed = useReminders((s) => s.bannerDismissed);
  const dismiss = useReminders((s) => s.dismissBanner);
  useBrowserReminders(due, now);

  if (dismissed || (due.length === 0 && overdue.length === 0)) return null;
  const today = dayKey(now);
  const dueToday = due.filter((d) => dayDiff(today, dayKey(new Date(d.dueAt))) === 0);
  const first = dueToday[0] ?? due[0] ?? overdue[0];
  return (
    <div className="bg-accent text-on-accent" role="status">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-2 text-sm">
        <span aria-hidden="true">⏰</span>
        <p className="flex-1">
          <strong>
            {dueToday.length > 0
              ? `${dueToday.length} due today`
              : due.length > 0
                ? `${due.length} due tomorrow`
                : `${overdue.length} overdue`}
          </strong>
          {first && (
            <>
              : {map.get(first.subjectId)?.emoji ?? '📋'} {first.title}
              {due.length + overdue.length > 1 ? ` and ${due.length + overdue.length - 1} more` : ''}.{' '}
            </>
          )}
          <Link to="/tasks" className="font-bold underline">
            See tasks
          </Link>
        </p>
        <button onClick={dismiss} aria-label="Dismiss reminder" className="rounded px-2 py-1 hover:bg-white/20">
          ✕
        </button>
      </div>
    </div>
  );
}

export function Layout() {
  const isAdmin = useIsAdmin();
  const logout = useLogout();
  const setSearchOpen = useUi((s) => s.setSearchOpen);
  const { pathname } = useLocation();

  // Fixed: Wrapped in a block so it doesn't implicitly return a promise/object to React
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [pathname]);

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `relative flex h-16 items-center px-3 text-sm font-bold transition-colors ${
      isActive
        ? 'text-fg after:absolute after:inset-x-2 after:bottom-0 after:h-[3px] after:rounded-t after:bg-accent'
        : 'text-fg/80 hover:text-primary'
    }`;

  return (
    <div className="flex min-h-screen flex-col">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-[70] focus:rounded focus:bg-surface focus:px-3 focus:py-2">
        Skip to content
      </a>

      {/* Top utility bar */}
      <div className="bg-ink text-white">
        <div className="mx-auto flex h-10 max-w-6xl items-center gap-3 px-4 text-xs">
          <p className="hidden truncate font-medium text-white/90 sm:block">🎓 {siteConfig.classSection}</p>
          <div className="ml-auto flex items-center gap-1">
            <Link to="/announcements" className="hidden rounded px-2 py-1 font-medium hover:bg-white/15 sm:block">📢 Announcements</Link>
            <button
              onClick={() => setSearchOpen(true)}
              aria-label="Search (Ctrl+K)"
              className="flex items-center gap-2 rounded-lg px-2.5 py-1 text-lg hover:bg-white/15"
            >
              <span aria-hidden="true">🔍</span>
              <kbd className="hidden rounded border border-white/40 px-1.5 text-[10px] lg:inline">Ctrl K</kbd>
            </button>
            <BellButton onInk />
            <ThemePicker onInk />
          </div>
        </div>
      </div>

      {/* Main navigation (sticky) */}
      <div className="sticky top-0 z-40">
        <header className="border-b border-border bg-surface shadow-sm">
          <div className="mx-auto flex h-16 max-w-6xl items-center gap-2 px-4">
            <Link to="/" className="mr-3 flex items-center gap-2.5" aria-label={`${siteConfig.siteName} home`}>
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-xl text-on-primary shadow" aria-hidden="true">📋</span>
              <span className="leading-tight">
                <span className="block text-base font-extrabold text-primary">{siteConfig.siteName}</span>
                <span className="hidden text-[11px] font-semibold uppercase tracking-wider text-accent sm:block">Stay on top of it</span>
              </span>
            </Link>
            <nav aria-label="Main" className="hidden flex-1 items-center md:flex">
              {NAV.map((n) => (
                <NavLink key={n.to} to={n.to} end={n.end} className={linkClass}>
                  {n.label}
                </NavLink>
              ))}
            </nav>
            <div className="ml-auto flex items-center gap-2">
              {isAdmin ? (
                <>
                  <QuickAdd />
                  <NavLink to="/admin" className="hidden rounded-lg bg-ink px-3.5 py-2 text-sm font-bold text-white hover:opacity-90 sm:block">
                    🔐 Admin
                  </NavLink>
                  <button onClick={() => logout.mutate()} className="hidden rounded-lg px-3 py-2 text-sm font-semibold text-muted hover:bg-surface-2 sm:block">
                    Log out
                  </button>
                </>
              ) : (
                <>
                  <Link to="/tasks" className="hidden rounded-lg bg-accent px-4 py-2.5 text-sm font-bold text-on-accent hover:opacity-90 lg:block">
                    ⏰ My tasks
                  </Link>
                  <Link to="/calendar" className="hidden rounded-lg bg-ink px-4 py-2.5 text-sm font-bold text-white hover:opacity-90 lg:block">
                    🗓️ Calendar
                  </Link>
                </>
              )}
            </div>
          </div>
        </header>
        <ReminderBanner />
      </div>

      <main id="main" className="mx-auto w-full max-w-6xl flex-1 px-4 pb-28 pt-6 md:pb-10">
        <Outlet />
      </main>

      <footer className="bg-ink px-4 pb-24 pt-10 text-white md:pb-10">
        <div className="mx-auto grid max-w-6xl gap-8 sm:grid-cols-3">
          <div>
            <p className="text-lg font-extrabold">📋 {siteConfig.siteName}</p>
            <p className="mt-2 text-sm text-white/80">{siteConfig.classSection}</p>
            <span className="mt-3 block h-1 w-12 rounded bg-accent" aria-hidden="true" />
          </div>
          <nav aria-label="Footer">
            <p className="text-sm font-bold uppercase tracking-wide text-white/70">Quick links</p>
            <ul className="mt-2 space-y-1 text-sm">
              {NAV.map((n) => (
                <li key={n.to}>
                  <Link to={n.to} className="text-white/90 hover:underline">{n.label}</Link>
                </li>
              ))}
            </ul>
          </nav>
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-white/70">Contact your teacher</p>
            <p className="mt-2 text-sm font-semibold">{siteConfig.teacherName}</p>
            {siteConfig.contactEmail && (
              <p className="text-sm">
                <a className="underline" href={`mailto:${siteConfig.contactEmail}`}>{siteConfig.contactEmail}</a>
              </p>
            )}
            {siteConfig.contactPhone && <p className="text-sm">{siteConfig.contactPhone}</p>}
          </div>
        </div>
      </footer>

      <nav aria-label="Main (mobile)" className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-6 border-t border-border bg-surface md:hidden">
        {NAV.filter((n) => n.mobile).map((n) => (
          <NavLink
            key={n.to}
            to={n.to}
            end={n.end}
            className={({ isActive }) =>
              `relative flex flex-col items-center gap-0.5 py-2 text-[11px] font-bold ${isActive ? 'text-primary after:absolute after:inset-x-3 after:top-0 after:h-[3px] after:rounded-b after:bg-accent' : 'text-muted'}`
            }
          >
            <span className="text-lg" aria-hidden="true">{n.emoji}</span>
            {n.label}
          </NavLink>
        ))}
      </nav>

      <QuickAdd floating />
      <SearchPalette />
      <AdminHost />
      <ConfirmHost />
      <Toasts />
    </div>
  );
}