import { useTranslation } from 'react-i18next';
import { ButtonLink } from '../components/ui/Button.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';

export default function NotFound() {
  const { t } = useTranslation();
  return (
    <EmptyState
      title={t('notFound.title')}
      text={t('notFound.text')}
      action={<ButtonLink to="/">{t('notFound.back')}</ButtonLink>}
    />
  );
}