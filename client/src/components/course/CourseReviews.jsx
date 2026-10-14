import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth.js';
import { useFetch } from '../../hooks/useFetch.js';
import { useToast } from '../../hooks/useToast.js';
import api, { getErrorMessage } from '../../services/api.js';
import { Card, CardBody } from '../ui/Card.jsx';
import Button from '../ui/Button.jsx';

// Ratings and comments for a course. A student can review once they have finished every lesson.
export default function CourseReviews({ courseId }) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const toast = useToast();
  const { data, reload } = useFetch(`/reviews/${courseId}`);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (data?.mine) {
      setRating(data.mine.rating);
      setComment(data.mine.comment || '');
    }
  }, [data]);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    try {
      await api.post(`/reviews/${courseId}`, { rating: Number(rating), comment });
      toast.success(t('extras.reviews.thanks'));
      reload();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  if (!data) return null;

  return (
    <Card>
      <CardBody className="space-y-4">
        <h2 className="font-display text-xl font-bold text-brand-800">{t('extras.reviews.title')}</h2>
        <p className="text-sm text-slate-600">
          {data.count
            ? t('extras.reviews.summary', { avg: data.average.toFixed(1), count: data.count })
            : t('extras.reviews.none')}
        </p>

        {data.canReview && (
          <form onSubmit={submit} className="space-y-3 rounded-xl border border-brand-100 p-4">
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-slate-700">{t('extras.reviews.yourRating')}</span>
              <select value={rating} onChange={(e) => setRating(e.target.value)} className="h-10 w-48 rounded-lg border border-brand-200 bg-white px-3">
                {[5, 4, 3, 2, 1].map((n) => (
                  <option key={n} value={n}>{'★'.repeat(n)} ({n})</option>
                ))}
              </select>
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              maxLength={1000}
              placeholder={t('extras.reviews.placeholder')}
              className="w-full rounded-lg border border-brand-200 bg-white px-3 py-2 text-sm"
            />
            <Button type="submit" loading={busy}>{data.mine ? t('extras.reviews.update') : t('extras.reviews.post')}</Button>
          </form>
        )}

        {user?.role === 'student' && !data.canReview && !data.mine && (
          <p className="text-sm text-slate-500">{t('extras.reviews.finishFirst')}</p>
        )}

        <ul className="space-y-3">
          {data.reviews.map((r) => (
            <li key={r._id} className="border-t border-brand-50 pt-3">
              <p className="text-sm font-semibold text-slate-800">
                {r.student?.name ?? '—'} <span className="text-gold-600">{'★'.repeat(r.rating)}</span>
              </p>
              {r.comment && <p className="mt-1 text-sm text-slate-600">{r.comment}</p>}
            </li>
          ))}
        </ul>
      </CardBody>
    </Card>
  );
}
