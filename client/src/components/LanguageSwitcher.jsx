import { useTranslation } from 'react-i18next';
import { LANGUAGES } from '../i18n/index.js';

export default function LanguageSwitcher({ className = '' }) {
  const { i18n, t } = useTranslation();

  return (
    <select
      value={i18n.resolvedLanguage ?? i18n.language}
      onChange={(e) => i18n.changeLanguage(e.target.value)}
      aria-label={t('language.label')}
      className={`h-9 rounded-lg border border-white/20 bg-brand-800 px-2 text-sm text-white outline-none focus:ring-2 focus:ring-gold-400 ${className}`}
    >
      {LANGUAGES.map((l) => (
        <option key={l.code} value={l.code}>
          {l.label}
        </option>
      ))}
    </select>
  );
}