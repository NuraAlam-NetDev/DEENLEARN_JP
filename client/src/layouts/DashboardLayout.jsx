import { useEffect, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../hooks/useAuth.js';
import { useToast } from '../hooks/useToast.js';
import Sidebar from '../components/Sidebar.jsx';
import Icon from '../components/ui/Icon.jsx';
import NotificationBell from '../components/notifications/NotificationBell.jsx';
import ThemeToggle from '../components/ui/ThemeToggle.jsx';

const BADGE_TONES = {
  student: 'green',
  teacher: 'gold',
  admin: 'gray',
};

// Shared shell for the three portals. See StudentLayout / TeacherLayout / AdminLayout.
export default function DashboardLayout({ portal, links }) {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [drawer, setDrawer] = useState(false);
  const portalLabel = t(`layout.portal.${portal}`);
  const badgeTone = BADGE_TONES[portal];

  // close the drawer after navigating
  useEffect(() => {
    setDrawer(false);
  }, [pathname]);

  // while the drawer is open: Escape closes it and the page behind does not scroll
  useEffect(() => {
    if (!drawer) return undefined;
    const onKey = (e) => e.key === 'Escape' && setDrawer(false);
    document.addEventListener('keydown', onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previous;
    };
  }, [drawer]);

  async function handleLogout() {
    navigate('/', { replace: true }); // leave the protected area first
    await logout();
    toast.info(t('layout.loggedOut'));
  }

  const firstName = user.name?.trim()?.split(/\s+/)[0] ?? '';

  return (
    <div className="min-h-screen lg:flex">
      {drawer && (
        <div
          className="fixed inset-0 z-30 bg-brand-950/50 lg:hidden"
          onClick={() => setDrawer(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed inset-y-0 start-0 z-40 w-72 max-w-[85vw] border-e border-brand-100 bg-white transition-transform duration-200 lg:sticky lg:top-0 lg:z-auto lg:h-screen lg:w-64 lg:max-w-none lg:shrink-0 lg:translate-x-0 ${
          drawer ? 'translate-x-0' : '-translate-x-full rtl:translate-x-full'
        }`}
      >
        <Sidebar
          portalLabel={portalLabel}
          badgeTone={badgeTone}
          links={links}
          user={user}
          onLogout={handleLogout}
          onClose={() => setDrawer(false)}
        />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-brand-100 bg-white/90 px-4 py-3 backdrop-blur sm:px-6">
          <button
            type="button"
            onClick={() => setDrawer(true)}
            aria-label={t('layout.openMenu')}
            aria-expanded={drawer}
            className="-ms-2 rounded-lg p-2 text-brand-700 hover:bg-brand-50 lg:hidden"
          >
            <Icon name="menu" className="h-6 w-6" />
          </button>
          <p className="min-w-0 flex-1 truncate text-sm text-slate-600" dir="auto">
            {t('layout.greeting', { name: firstName })}
          </p>
          <NotificationBell />
          <ThemeToggle />
          <Link
            to={user.role === 'teacher' ? '/teacher/profile' : user.role === 'student' ? '/student/profile' : '/admin/profile'}
            aria-label="My profile"
            className="shrink-0"
          >
            {user.avatar ? (
              <img src={user.avatar} alt="" className="h-9 w-9 rounded-full object-cover" />
            ) : (
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gold-500 text-sm font-bold text-brand-950">
                {user.name?.trim()?.[0]?.toUpperCase() ?? '?'}
              </span>
            )}
          </Link>
          <Link to="/" className="shrink-0 text-sm font-medium text-brand-700 hover:text-brand-600">
            {t('layout.website')}
          </Link>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}