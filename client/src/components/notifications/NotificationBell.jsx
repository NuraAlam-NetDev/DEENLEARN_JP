import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth.js';
import api from '../../services/api.js';

// The notifications page for each role
const pageFor = (role) => (role === 'teacher' ? '/teacher/notifications' : role === 'admin' || role === 'super_admin' ? '/admin/notifications' : '/student/notifications');

// Bell icon with the unread count, for every logged-in user. Refreshed every minute.
export default function NotificationBell() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (!user) return undefined;
    let alive = true;
    const load = () =>
      api
        .get('/notifications')
        .then(({ data }) => alive && setUnread(data.unread))
        .catch(() => {});
    load();
    const timer = setInterval(load, 60000);
    const onChanged = () => load();
    window.addEventListener('notifications-changed', onChanged);
    return () => {
      alive = false;
      clearInterval(timer);
      window.removeEventListener('notifications-changed', onChanged);
    };
  }, [user]);

  if (!user) return null;

  return (
    <Link
      to={pageFor(user.role)}
      aria-label={t('extras.bell.label')}
      title={t('extras.bell.label')}
      className="relative shrink-0 rounded-lg p-2 text-brand-700 hover:bg-brand-50"
    >
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M6 8a6 6 0 1 1 12 0c0 7 3 8 3 8H3s3-1 3-8" />
        <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
      </svg>
      {unread > 0 && (
        <span className="absolute -end-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-xs font-bold text-white">
          {unread > 99 ? '99+' : unread}
        </span>
      )}
    </Link>
  );
}
