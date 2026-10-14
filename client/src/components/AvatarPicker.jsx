import { useRef, useState } from 'react';
import { useAuth } from '../hooks/useAuth.js';
import { useToast } from '../hooks/useToast.js';
import api, { getErrorMessage } from '../services/api.js';
import Button from './ui/Button.jsx';
import { Card, CardBody } from './ui/Card.jsx';

const MAX_BYTES = 5 * 1024 * 1024;

// Profile picture for any account (student, teacher, admin). Shows the initial when there is no picture.
export default function AvatarPicker() {
  const { user, updateUser } = useAuth();
  const toast = useToast();
  const input = useRef(null);
  const [busy, setBusy] = useState(false);
  const initial = user.name?.trim()?.[0]?.toUpperCase() ?? '?';

  async function upload(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (file.size > MAX_BYTES) return toast.error('The picture must be 5 MB or smaller');
    const form = new FormData();
    form.append('file', file);
    setBusy(true);
    try {
      const { data } = await api.put('/auth/me/avatar', form);
      updateUser(data.user);
      toast.success('Profile picture updated');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    setBusy(true);
    try {
      const { data } = await api.delete('/auth/me/avatar');
      updateUser(data.user);
      toast.success('Profile picture removed');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <CardBody className="flex flex-wrap items-center gap-4">
        {user.avatar ? (
          <img src={user.avatar} alt="Your profile picture" className="h-20 w-20 shrink-0 rounded-full object-cover" />
        ) : (
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-gold-500 font-display text-3xl font-bold text-brand-950" aria-hidden="true">
            {initial}
          </div>
        )}
        <div className="min-w-0 space-y-2">
          <p className="text-sm text-slate-600">JPG, PNG, WebP or GIF, up to 5 MB.</p>
          <div className="flex flex-wrap gap-2">
            <input ref={input} type="file" accept="image/*" className="hidden" onChange={upload} />
            <Button onClick={() => input.current?.click()} loading={busy} disabled={busy}>
              {user.avatar ? 'Change picture' : 'Upload picture'}
            </Button>
            {user.avatar && (
              <Button variant="outline" onClick={remove} disabled={busy}>Remove</Button>
            )}
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
