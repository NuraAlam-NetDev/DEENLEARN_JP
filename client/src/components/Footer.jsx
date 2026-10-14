import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../hooks/useAuth.js';
import { homeFor } from '../utils/roles.js';
import { BrandLink } from './ui/Logo.jsx';
import ArabicText from './ui/ArabicText.jsx';

const linkClass = 'text-white/75 hover:text-gold-300';

export default function Footer() {
  const { t } = useTranslation();
  const { user } = useAuth();

  return (
    <footer className="pattern-star mt-12 border-t-2 border-gold-500 bg-brand-900 text-white">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-2 md:grid-cols-3">
        <div>
          <BrandLink />
          <p className="mt-3 max-w-xs text-sm text-white/75">{t('footer.tagline')}</p>
          <ArabicText size="sm" className="mt-3 text-gold-300">
            بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
          </ArabicText>
        </div>

        <nav aria-label={t('footer.explore')}>
          <h2 className="font-display text-xl font-bold text-gold-300">{t('footer.explore')}</h2>
          <ul className="mt-3 space-y-2 text-sm">
            <li>
              <Link to="/" className={linkClass}>
                {t('footer.home')}
              </Link>
            </li>
            <li>
              <Link to="/courses" className={linkClass}>
                {t('footer.courses')}
              </Link>
            </li>
            <li>
              <Link to="/status" className={linkClass}>
                {t('footer.systemStatus')}
              </Link>
            </li>
          </ul>
        </nav>

        <div>
          <h2 className="font-display text-xl font-bold text-gold-300">{t('footer.account')}</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {user ? (
              <li>
                <Link to={homeFor(user.role)} className={linkClass}>
                  {t('footer.myDashboard')}
                </Link>
              </li>
            ) : (
              <>
                <li>
                  <Link to="/login" className={linkClass}>
                    {t('footer.login')}
                  </Link>
                </li>
                <li>
                  <Link to="/register" className={linkClass}>
                    {t('footer.createAccount')}
                  </Link>
                </li>
              </>
            )}
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10 px-4 py-4 text-center text-xs text-white/60">
        {t('footer.rights', { year: new Date().getFullYear() })}
      </div>
    </footer>
  );
}