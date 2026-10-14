import CertificateQr from '../../components/CertificateQr.jsx';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth.js';
import { useFetch } from '../../hooks/useFetch.js';
import QueryState from '../../components/ui/QueryState.jsx';
import { useToast } from '../../hooks/useToast.js';
import { getErrorMessage, getFieldErrors } from '../../services/api.js';
import { claimCertificate, downloadCertificate } from '../../services/certificateService.js';
import { formatDate } from '../../utils/format.js';
import Alert from '../../components/Alert.jsx';
import FormField from '../../components/FormField.jsx';
import Badge from '../../components/ui/Badge.jsx';
import Button, { ButtonLink } from '../../components/ui/Button.jsx';
import { Card } from '../../components/ui/Card.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import Icon from '../../components/ui/Icon.jsx';
import { Skeleton } from '../../components/ui/Skeleton.jsx';

// A finished course with no certificate yet: choose the name, then claim it
function ClaimCard({ item, defaultName, onClaimed }) {
  const { t } = useTranslation();
  const toast = useToast();
  const [name, setName] = useState(defaultName);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await claimCertificate(item.courseId, name.trim());
      toast.success(t('student.certificates.readyToast'));
      onClaimed();
    } catch (err) {
      setError(getFieldErrors(err).recipientName || getErrorMessage(err));
      setBusy(false);
    }
  }

  return (
    <Card className="p-4">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="break-words text-lg font-bold text-brand-800" dir="auto">{item.courseTitle}</h3>
        <Badge tone="green">{t('student.certificates.courseCompleted')}</Badge>
      </div>

      {item.eligible ? (
        <form onSubmit={submit} noValidate className="mt-3 space-y-3">
          <FormField
            label={t('student.certificates.nameLabel')}
            name="recipientName"
            value={name}
            maxLength={80}
            error={error}
            hint={t('student.certificates.nameHint')}
            onChange={(e) => { setName(e.target.value); setError(''); }}
          />
          <Button type="submit" loading={busy} disabled={!name.trim()}>
            <Icon name="award" className="h-4 w-4" />
            {t('student.certificates.getCertificate')}
          </Button>
        </form>
      ) : (
        <div className="mt-3">
          <Alert type="info">
            {t('student.certificates.pendingQuiz', { count: item.pendingQuizzes.length })}
            <ul className="mt-1 list-disc ps-5">
              {item.pendingQuizzes.map((q) => (
                <li key={q.lessonId} dir="auto">
                  <Link to={`/student/courses/${item.courseId}/lessons/${q.lessonId}?tab=quiz`} className="font-semibold underline">
                    {q.lessonTitle}
                  </Link>
                </li>
              ))}
            </ul>
          </Alert>
        </div>
      )}
    </Card>
  );
}

function IssuedCard({ certificate }) {
  const { t } = useTranslation();
  const toast = useToast();
  const [busy, setBusy] = useState(false);

  async function download() {
    setBusy(true);
    try {
      await downloadCertificate(certificate);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card as="li" className="flex flex-wrap items-center gap-3 p-4">
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gold-100 text-gold-700">
        <Icon name="award" className="h-6 w-6" />
      </span>
      <CertificateQr code={certificate.code} size={80} />
      <div className="min-w-0 flex-1">
        <h3 className="break-words text-lg font-bold leading-snug text-brand-800" dir="auto">{certificate.courseTitle}</h3>
        <p className="text-sm text-slate-500">
          {t('student.certificates.issued', { date: formatDate(certificate.issuedAt) })} ·{' '}
          <span className="ltr-isolate font-mono">{certificate.code}</span>
        </p>
      </div>
      <Button onClick={download} loading={busy} variant="outline">
        <Icon name="download" className="h-4 w-4" />
        {t('student.certificates.downloadPdf')}
      </Button>
    </Card>
  );
}

// /student/certificates
export default function Certificates() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { data, loading, error, reload } = useFetch('/certificates/mine');

  return (
    <div>
      <h1 className="text-3xl font-bold text-brand-800">{t('student.certificates.title')}</h1>
      <p className="mt-1 text-slate-600">{t('student.certificates.subtitle')}</p>

      <QueryState
        loading={loading && !data}
        error={error}
        onRetry={reload}
        retryLabel={t('report.retry')}
        empty={!!data && data.certificates.length === 0 && data.claimable.length === 0}
        emptyTitle={t('student.certificates.emptyTitle')}
        emptyText={t('student.certificates.emptyText')}
        emptyAction={<ButtonLink to="/student/courses">{t('student.certificates.continueLearning')}</ButtonLink>}
      >
        {data && data.claimable.length > 0 && (
          <section className="mt-6 space-y-3" aria-labelledby="ready-heading">
            <h2 id="ready-heading" className="text-2xl font-bold text-brand-800">
              {t('student.certificates.readyHeading')}
            </h2>
            {data.claimable.map((item) => (
              <ClaimCard key={item.courseId} item={item} defaultName={user.name} onClaimed={reload} />
            ))}
          </section>
        )}

        {data && data.certificates.length > 0 && (
          <section className="mt-6" aria-labelledby="issued-heading">
            <h2 id="issued-heading" className="mb-3 text-2xl font-bold text-brand-800">
              {t('student.certificates.issuedHeading')}
            </h2>
            <ul className="space-y-3">
              {data.certificates.map((c) => <IssuedCard key={c._id} certificate={c} />)}
            </ul>
          </section>
        )}
      </QueryState>

    </div>
  );
}