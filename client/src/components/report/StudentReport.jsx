import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { formatDate, formatDateTime } from '../../utils/format.js';
import Alert from '../../components/Alert.jsx';
import { Spinner } from '../../components/Spinner.jsx';
import Badge from '../../components/ui/Badge.jsx';
import { Card, CardBody, StatCard } from '../../components/ui/Card.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import ProgressBar from '../../components/ui/ProgressBar.jsx';

const TABS = ['overview', 'courses', 'quizzes', 'marks', 'certificates'];

const STATUS_TONE = {
  certified: 'green',
  ready: 'gold',
  quiz_pending: 'gold',
  in_progress: 'gray',
  not_started: 'gray',
  passed: 'green',
  not_passed: 'red',
  not_attempted: 'gray',
};

const tabClass = (active) =>
  `shrink-0 border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors ${
    active ? 'border-brand-700 text-brand-800' : 'border-transparent text-slate-500 hover:text-brand-700'
  }`;

function Overview({ o, t }) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <StatCard label={t('report.overview.courses')} value={o.coursesEnrolled} />
      <StatCard label={t('report.overview.completed')} value={o.coursesCompleted} />
      <StatCard
        label={t('report.overview.lessons')}
        value={`${o.lessonsCompleted}/${o.lessonsTotal}`}
      />
      <StatCard label={t('report.overview.avgProgress')} value={`${o.averageCourseProgress}%`} />
      <StatCard
        label={t('report.overview.quizzesPassed')}
        value={`${o.quizzesPassed}/${o.quizzesTaken}`}
      />
      <StatCard label={t('report.overview.avgScore')} value={`${o.averageBestScore}%`} />
      <StatCard label={t('report.overview.certificates')} value={o.certificates} />
    </div>
  );
}

function Courses({ rows, t }) {
  if (!rows.length) return <EmptyState title={t('report.empty.title')} text={t('report.empty.text')} />;
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[40rem] text-start text-sm">
        <thead>
          <tr className="border-b border-brand-100 text-slate-500">
            <th className="py-2 text-start font-medium">{t('report.table.course')}</th>
            <th className="py-2 text-start font-medium">{t('report.table.progress')}</th>
            <th className="py-2 text-start font-medium">{t('report.table.quizzes')}</th>
            <th className="py-2 text-start font-medium">{t('report.table.avgScore')}</th>
            <th className="py-2 text-start font-medium">{t('report.table.status')}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((c) => (
            <tr key={c.courseId} className="border-b border-brand-50 align-top">
              <td className="py-3 pe-3">
                <Link to={`/student/courses/${c.courseId}`} className="font-semibold text-brand-800 hover:underline" dir="auto">
                  {c.title}
                </Link>
                <p className="text-xs text-slate-500" dir="auto">{c.teacher}</p>
              </td>
              <td className="py-3 pe-3 min-w-40">
                <ProgressBar value={c.progress} />
                <p className="mt-1 text-xs text-slate-500">
                  {t('report.table.lessonsDone', { done: c.completedLessons, total: c.totalLessons })}
                </p>
              </td>
              <td className="py-3 pe-3">
                {t('report.table.quizzesPassed', { passed: c.quizzesPassed, taken: c.quizzesTaken })}
              </td>
              <td className="py-3 pe-3">{c.quizzesTaken ? `${c.averageBestScore}%` : '—'}</td>
              <td className="py-3">
                <Badge tone={STATUS_TONE[c.status]}>{t(`report.status.${c.status}`)}</Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Quizzes({ rows, t }) {
  if (!rows.length) return <EmptyState title={t('report.emptyQuiz.title')} text={t('report.emptyQuiz.text')} />;
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[46rem] text-start text-sm">
        <thead>
          <tr className="border-b border-brand-100 text-slate-500">
            <th className="py-2 text-start font-medium">{t('report.table.quiz')}</th>
            <th className="py-2 text-start font-medium">{t('report.table.course')}</th>
            <th className="py-2 text-start font-medium">{t('report.table.attempts')}</th>
            <th className="py-2 text-start font-medium">{t('report.table.best')}</th>
            <th className="py-2 text-start font-medium">{t('report.table.pass')}</th>
            <th className="py-2 text-start font-medium">{t('report.table.status')}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((q) => (
            <tr key={q.quizId} className="border-b border-brand-50 align-top">
              <td className="py-3 pe-3">
                <p className="font-semibold text-slate-800" dir="auto">{q.quizTitle}</p>
                <p className="text-xs text-slate-500" dir="auto">{q.lessonTitle}</p>
                {q.required && <Badge tone="gold" className="mt-1">{t('report.table.required')}</Badge>}
              </td>
              <td className="py-3 pe-3" dir="auto">{q.courseTitle}</td>
              <td className="py-3 pe-3">{q.attempts}</td>
              <td className="py-3 pe-3">{q.bestScore === null ? '—' : `${q.bestScore}%`}</td>
              <td className="py-3 pe-3">{t('report.table.passMark', { n: q.passingScore })}</td>
              <td className="py-3">
                <Badge tone={STATUS_TONE[q.status]}>{t(`report.status.${q.status}`)}</Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Marks({ rows, t }) {
  if (!rows.length) return <EmptyState title={t('report.emptyMarks.title')} text={t('report.emptyMarks.text')} />;
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[40rem] text-start text-sm">
        <thead>
          <tr className="border-b border-brand-100 text-slate-500">
            <th className="py-2 text-start font-medium">{t('report.table.when')}</th>
            <th className="py-2 text-start font-medium">{t('report.table.quiz')}</th>
            <th className="py-2 text-start font-medium">{t('report.table.course')}</th>
            <th className="py-2 text-start font-medium">{t('report.table.marks')}</th>
            <th className="py-2 text-start font-medium">{t('report.table.result')}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((m) => (
            <tr key={m.attemptId} className="border-b border-brand-50">
              <td className="py-2 pe-3 text-slate-500">{formatDateTime(m.at)}</td>
              <td className="py-2 pe-3" dir="auto">{m.quizTitle}</td>
              <td className="py-2 pe-3" dir="auto">{m.courseTitle}</td>
              <td className="py-2 pe-3">
                <span className="font-semibold">{m.score}%</span>{' '}
                <span className="text-slate-500">({t('report.table.correctOf', { correct: m.correct, total: m.total })})</span>
              </td>
              <td className="py-2">
                <Badge tone={m.passed ? 'green' : 'red'}>{m.passed ? t('report.status.passed') : t('report.status.not_passed')}</Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Certificates({ data, t }) {
  return (
    <div className="space-y-6">
      <section aria-labelledby="issued-h">
        <h2 id="issued-h" className="mb-3 font-display text-xl font-bold text-brand-800">{t('report.certs.issued')}</h2>
        {data.issued.length === 0 ? (
          <p className="text-sm text-slate-500">{t('report.certs.noneIssued')}</p>
        ) : (
          <ul className="space-y-2">
            {data.issued.map((c) => (
              <li key={c.code} className="rounded-lg border border-brand-100 p-3">
                <p className="font-semibold text-slate-800" dir="auto">{c.courseTitle}</p>
                <p className="text-xs text-slate-500">
                  {t('report.certs.issuedOn', { date: formatDate(c.issuedAt) })} · <span className="font-mono">{c.code}</span>
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="pending-h">
        <h2 id="pending-h" className="mb-3 font-display text-xl font-bold text-brand-800">{t('report.certs.pending')}</h2>
        {data.pending.length === 0 ? (
          <p className="text-sm text-slate-500">{t('report.certs.nonePending')}</p>
        ) : (
          <ul className="space-y-2">
            {data.pending.map((p) => (
              <li key={p.courseId} className="rounded-lg border border-gold-300 bg-gold-50/40 p-3">
                <p className="font-semibold text-slate-800" dir="auto">{p.title}</p>
                <ul className="mt-1 list-disc ps-5 text-sm text-slate-600">
                  {p.remainingLessons > 0 && <li>{t('report.certs.lessonsLeft', { n: p.remainingLessons })}</li>}
                  {p.pendingQuizzes.map((q) => (
                    <li key={q.quizTitle} dir="auto">{t('report.certs.quizLeft', { title: q.quizTitle })}</li>
                  ))}
                  {p.remainingLessons === 0 && p.pendingQuizzes.length === 0 && <li>{t('report.certs.claimNow')}</li>}
                </ul>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

// The full learning record, shown to the student (own report) and to staff (student progress).
export default function StudentReport({ data }) {
  const { t } = useTranslation();
  const [tab, setTab] = useState('overview');

  return (
    <div className="space-y-5">
      {data.student && (
        <div>
          <p className="font-display text-2xl font-bold text-brand-800" dir="auto">{data.student.name}</p>
          <p className="text-sm text-slate-500" dir="auto">{data.student.email}</p>
        </div>
      )}

      <div className="flex gap-1 overflow-x-auto border-b border-brand-100" role="tablist" aria-label={t('report.title')}>
        {TABS.map((key) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={tab === key}
            className={tabClass(tab === key)}
            onClick={() => setTab(key)}
          >
            {t(`report.tabs.${key}`)}
          </button>
        ))}
      </div>

      <Card>
        <CardBody>
          {tab === 'overview' && <Overview o={data.overview} t={t} />}
          {tab === 'courses' && <Courses rows={data.courses} t={t} />}
          {tab === 'quizzes' && <Quizzes rows={data.quizzes} t={t} />}
          {tab === 'marks' && <Marks rows={data.marks} t={t} />}
          {tab === 'certificates' && <Certificates data={data.certificates} t={t} />}
        </CardBody>
      </Card>
    </div>
  );
}
