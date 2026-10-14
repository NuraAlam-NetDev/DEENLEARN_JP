import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth.js';
import { useToast } from '../../hooks/useToast.js';
import api, { getErrorMessage } from '../../services/api.js';

// Button on the course page: save the course for later (students only)
export default function WishlistButton({ courseId }) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const toast = useToast();
  const [saved, setSaved] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (user?.role !== 'student') return;
    api
      .get('/wishlist')
      .then(({ data }) => setSaved(data.items.some((i) => i.course?._id === courseId)))
      .catch(() => setSaved(false));
  }, [user, courseId]);

  if (user?.role !== 'student' || saved === null) return null;

  async function toggle() {
    setBusy(true);
    try {
      if (saved) {
        await api.delete(`/wishlist/${courseId}`);
        setSaved(false);
        toast.success(t('extras.wishlist.removedToast'));
      } else {
        await api.post(`/wishlist/${courseId}`);
        setSaved(true);
        toast.success(t('extras.wishlist.savedToast'));
      }
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={busy}
      className="rounded-full border border-brand-200 px-3 py-1 text-sm font-semibold text-brand-700 hover:bg-brand-50"
    >
      {saved ? t('extras.wishlist.saved') : t('extras.wishlist.save')}
    </button>
  );
}
