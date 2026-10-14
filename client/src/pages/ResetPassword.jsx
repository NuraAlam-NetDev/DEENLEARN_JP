import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api, { getErrorMessage } from '../services/api.js';
import Alert from '../components/Alert.jsx';
import FormField from '../components/FormField.jsx';
import Button from '../components/ui/Button.jsx';
import { Card } from '../components/ui/Card.jsx';

export default function ResetPassword() {
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState('');
  const [error, setError] = useState('');

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    if (password !== confirm) return setError('The two passwords do not match.');
    setBusy(true);
    try {
      const { data } = await api.post('/auth/reset', { token, password });
      setDone(data.message);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-md py-10">
      <Card className="space-y-4 p-6">
        <h1 className="font-display text-2xl font-bold text-brand-800">Choose a new password</h1>
        {!token && <Alert>This link is incomplete. Please use the link from your email.</Alert>}
        {done ? (
          <>
            <Alert type="info">{done}</Alert>
            <Link to="/login" className="inline-block font-semibold text-brand-700 hover:underline">Go to login</Link>
          </>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4" noValidate>
            {error && <Alert>{error}</Alert>}
            <FormField label="New password" type="password" name="password" value={password} onChange={(e) => setPassword(e.target.value)} hint="At least 8 characters, with a letter and a number." />
            <FormField label="Confirm new password" type="password" name="confirm" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
            <Button type="submit" full loading={busy} disabled={!token}>Save new password</Button>
          </form>
        )}
      </Card>
    </div>
  );
}
