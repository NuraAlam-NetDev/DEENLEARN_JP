import { useState } from 'react';
import { Link } from 'react-router-dom';
import api, { getErrorMessage } from '../services/api.js';
import Alert from '../components/Alert.jsx';
import FormField from '../components/FormField.jsx';
import Button from '../components/ui/Button.jsx';
import { Card } from '../components/ui/Card.jsx';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function onSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const { data } = await api.post('/auth/forgot', { email: email.trim() });
      setMessage(data.message);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-md py-10">
      <Card className="space-y-4 p-6">
        <h1 className="font-display text-2xl font-bold text-brand-800">Forgot password</h1>
        <p className="text-sm text-slate-600">Enter your email. We will send you a link to choose a new password.</p>
        {message && <Alert type="info">{message}</Alert>}
        {error && <Alert>{error}</Alert>}
        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <FormField label="Email" type="email" name="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <Button type="submit" full loading={busy}>Send reset link</Button>
        </form>
        <p className="text-sm">
          <Link to="/login" className="font-semibold text-brand-700 hover:underline">Back to login</Link>
        </p>
      </Card>
    </div>
  );
}
