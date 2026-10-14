import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { BrandLink } from './ui/Logo.jsx';
import Badge from './ui/Badge.jsx';
import Icon from './ui/Icon.jsx';

const linkClass = ({ isActive }) =>
  `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
    isActive
      ? 'bg-brand-700 text-white shadow-sm'
      : 'text-slate-700 hover:bg-brand-50 hover:text-brand-800'
  }`;

// Used inside DashboardLayout: a fixed column on large screens, a slide-in drawer on phones.
export default function Sidebar({ portalLabel, badgeTone, links, user, onLogout, onClose }) {
  const { t } = useTranslation();
  const initial = user.name?.trim()?.[0]?.toUpperCase() ?? '?';

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-start justify-between gap-2 p-4">
        <div>
          <BrandLink tone="dark" />
          <Badge tone={badgeTone} className="mt-2">
            {portalLabel}
          </Badge>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label={t('nav.closeMenu')}
          className="rounded-lg p-2 text-slate-500 hover:bg-brand-50 lg:hidden"
        >
          <Icon name="x" className="h-6 w-6" />
        </button>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2" aria-label={t('sidebar.menu', { label: portalLabel })}>
        {links.map((l) => (
          <NavLink key={l.to} to={l.to} end={l.end} className={linkClass}>
            <Icon name={l.icon} />
            {l.label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-brand-100 p-4">
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gold-500 font-display text-xl font-bold text-brand-950"
            aria-hidden="true"
          >
            {initial}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-800" dir="auto">
              {user.name}
            </p>
            <p className="ltr-isolate truncate text-xs text-slate-500">{user.email}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onLogout}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-brand-200 px-3 py-2 text-sm font-medium text-brand-700 hover:bg-brand-50"
        >
          <Icon name="logout" className="h-4 w-4" />
          {t('nav.logout')}
        </button>
      </div>
    </div>
  );
}
