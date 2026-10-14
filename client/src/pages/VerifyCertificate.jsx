import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useFetch } from '../hooks/useFetch.js';
import { formatDate } from '../utils/format.js';
import Alert from '../components/Alert.jsx';
import FormField from '../components/FormField.jsx';
import Button from '../components/ui/Button.jsx';
import { Card, CardBody } from '../components/ui/Card.jsx';
import Icon from '../components/ui/Icon.jsx';
import { Skeleton } from '../components/ui/Skeleton.jsx';

// /verify and /verify/:code  (public: anyone with a code can check a certificate)
export default function VerifyCertificate() {
  const { code } = useParams();
  const navigate = useNavigate();
  const [input, setInput] = useState(code ?? '');
  const { data, loading, status } = useFetch(code ? `/certificates/verify/${encodeURIComponent(code)}` : null);

  function submit(e) {
    e.preventDefault();
    const value = input.trim().toUpperCase();
    if (value) navigate(`/verify/${encodeURIComponent(value)}`);
  }

  return (
    <div className="mx-auto max-w-xl space-y-5">
      <h1 className="text-3xl font-bold text-brand-800">Verify a certificate</h1>
      <p className="text-slate-600">Enter the certificate ID printed at the bottom of the PDF.</p>

      <form onSubmit={submit} className="flex items-end gap-2">
        <div className="flex-1">
          <FormField label="Certificate ID" value={input} onChange={(e) => setInput(e.target.value)} placeholder="DL-XXXX-XXXX-XXXX" dir="ltr" />
        </div>
        <Button type="submit" disabled={!input.trim()}>Check</Button>
      </form>

      {loading && <Skeleton className="h-40 w-full" />}
      {code && status === 404 && <Alert>No certificate was found with this ID. Check it and try again.</Alert>}
      {code && status && status !== 404 && !data && <Alert>Could not check this certificate right now.</Alert>}

      {data?.valid && (
        <Card className="border-brand-300">
          <CardBody className="space-y-2 text-center">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-100 text-brand-700">
              <Icon name="award" className="h-6 w-6" />
            </span>
            <p className="font-semibold text-brand-700">This certificate is genuine</p>
            <p className="font-display text-3xl font-bold text-ink" dir="auto">{data.certificate.recipientName}</p>
            <p className="text-slate-600">completed</p>
            <p className="font-display text-xl font-bold text-brand-800" dir="auto">{data.certificate.courseTitle}</p>
            {data.certificate.teacherName && <p className="text-sm text-slate-500" dir="auto">Taught by {data.certificate.teacherName}</p>}
            <p className="text-sm text-slate-500">Issued {formatDate(data.certificate.issuedAt)}</p>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
