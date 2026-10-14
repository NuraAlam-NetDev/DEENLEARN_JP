import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useFetch } from '../../hooks/useFetch.js';
import api from '../../services/api.js';
import QueryState from '../../components/ui/QueryState.jsx';
import { Card } from '../../components/ui/Card.jsx';
import Button from '../../components/ui/Button.jsx';

// Courses saved for later
export default function Wishlist() {
  const { t } = useTranslation();
  const { data, loading, error, reload } = useFetch('/wishlist');

  async function remove(courseId) {
    await api.delete(`/wishlist/${courseId}`);
    reload();
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-3xl font-bold text-brand-800">{t('extras.wishlist.title')}</h1>
        <p className="mt-1 text-slate-600">{t('extras.wishlist.subtitle')}</p>
      </div>

      <QueryState
        loading={loading && !data}
        error={error}
        onRetry={reload}
        retryLabel={t('report.retry')}
        empty={!!data && data.items.length === 0}
        emptyTitle={t('extras.wishlist.empty')}
        emptyText={t('extras.wishlist.emptyText')}
      >
        <ul className="grid gap-3 sm:grid-cols-2">
          {data?.items.map((i) => (
            <li key={i._id}>
              <Card className="space-y-3 p-4">
                <div>
                  <p className="font-semibold text-slate-800" dir="auto">{i.course.title}</p>
                  <p className="text-xs capitalize text-slate-500">{i.course.category}</p>
                </div>
                <div className="flex gap-2">
                  <Link to={`/courses/${i.course._id}`} className="inline-flex h-9 items-center rounded-lg bg-brand-700 px-3 text-sm font-semibold text-white hover:bg-brand-800">
                    {t('extras.wishlist.view')}
                  </Link>
                  <Button variant="outline" size="sm" onClick={() => remove(i.course._id)}>{t('extras.wishlist.remove')}</Button>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      </QueryState>
    </div>
  );
}
