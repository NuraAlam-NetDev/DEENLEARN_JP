import { useEffect, useState } from 'react';
import Button from '../components/ui/Button.jsx';
import { Card, CardBody, CardHeader, CourseCard, StatCard } from '../components/ui/Card.jsx';
import Modal, { ConfirmDialog } from '../components/ui/Modal.jsx';
import Badge from '../components/ui/Badge.jsx';
import ProgressBar from '../components/ui/ProgressBar.jsx';
import ArabicText from '../components/ui/ArabicText.jsx';
import TextBlock from '../components/ui/TextBlock.jsx';
import Alert from '../components/Alert.jsx';
import FormField from '../components/FormField.jsx';
import { useToast } from '../hooks/useToast.js';

// Full class names written out, so Tailwind can find and generate them
const brand = [
  ['50', 'bg-brand-50 text-brand-900'], ['100', 'bg-brand-100 text-brand-900'],
  ['200', 'bg-brand-200 text-brand-900'], ['300', 'bg-brand-300 text-brand-900'],
  ['400', 'bg-brand-400 text-brand-950'], ['500', 'bg-brand-500 text-white'],
  ['600', 'bg-brand-600 text-white'], ['700', 'bg-brand-700 text-white'],
  ['800', 'bg-brand-800 text-white'], ['900', 'bg-brand-900 text-white'],
  ['950', 'bg-brand-950 text-white'],
];
const gold = [
  ['50', 'bg-gold-50 text-gold-900'], ['100', 'bg-gold-100 text-gold-900'],
  ['200', 'bg-gold-200 text-gold-900'], ['300', 'bg-gold-300 text-gold-900'],
  ['400', 'bg-gold-400 text-gold-900'], ['500', 'bg-gold-500 text-brand-950'],
  ['600', 'bg-gold-600 text-white'], ['700', 'bg-gold-700 text-white'],
  ['800', 'bg-gold-800 text-white'], ['900', 'bg-gold-900 text-white'],
];

const sample = `As-salamu alaykum. This paragraph is English, so it reads left to right.

اَلْحَمْدُ لِلَّهِ رَبِّ ٱلْعَالَمِينَ

এই অনুচ্ছেদটি বাংলায় লেখা, তাই এটি বাম থেকে ডান দিকে পড়া হয়।`;

function Section({ title, children }) {
  return (
    <section className="space-y-3">
      <h2 className="border-b border-gold-300 pb-1 text-2xl font-bold text-brand-800">{title}</h2>
      {children}
    </section>
  );
}

export default function Design() {
  const toast = useToast();
  const [modal, setModal] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [rtl, setRtl] = useState(false);

  // lets you preview the whole page right-to-left
  useEffect(() => {
    document.documentElement.dir = rtl ? 'rtl' : 'ltr';
    return () => {
      document.documentElement.dir = 'ltr';
    };
  }, [rtl]);

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-4xl font-bold text-brand-800">Design system</h1>
          <p className="text-slate-600">Colors, type, buttons, cards, modals and toasts. Dev-only page.</p>
        </div>
        <Button variant={rtl ? 'gold' : 'outline'} onClick={() => setRtl((v) => !v)}>
          {rtl ? 'Back to left-to-right' : 'Preview right-to-left'}
        </Button>
      </div>

      <Section title="Colors">
        <div className="grid grid-cols-5 gap-2 sm:grid-cols-11">
          {brand.map(([n, cls]) => (
            <div key={n} className={`flex h-16 items-end rounded-lg p-1 text-xs ${cls}`}>
              {n}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-5 gap-2 sm:grid-cols-10">
          {gold.map(([n, cls]) => (
            <div key={n} className={`flex h-16 items-end rounded-lg p-1 text-xs ${cls}`}>
              {n}
            </div>
          ))}
        </div>
      </Section>

      <Section title="Typography">
        <Card>
          <CardBody className="space-y-3">
            <p className="font-display text-4xl font-bold text-brand-800">Amiri headings</p>
            <p>Noto Sans body text is clear and readable on phones and desktops.</p>
            <p>ইসলামিক শিক্ষা: বাংলা লেখা Noto Sans Bengali ফন্টে দেখানো হয়।</p>
            <ArabicText size="lg" className="text-brand-800">
              بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
            </ArabicText>
            <p className="text-sm text-slate-500">
              Email inside RTL text stays readable: <span className="ltr-isolate">teacher@example.com</span>
            </p>
          </CardBody>
        </Card>
      </Section>

      <Section title="Mixed-direction text block">
        <Card>
          <CardBody>
            <TextBlock text={sample} />
          </CardBody>
        </Card>
      </Section>

      <Section title="Buttons">
        <div className="flex flex-wrap gap-3">
          <Button>Primary</Button>
          <Button variant="gold">Gold</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="danger">Danger</Button>
          <Button loading>Loading</Button>
          <Button disabled>Disabled</Button>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button size="sm">Small</Button>
          <Button size="md">Medium</Button>
          <Button size="lg">Large</Button>
        </div>
      </Section>

      <Section title="Badges, alerts, form">
        <div className="flex flex-wrap gap-2">
          <Badge tone="green">Published</Badge>
          <Badge tone="gold">Pending</Badge>
          <Badge tone="gray">Draft</Badge>
          <Badge tone="red">Banned</Badge>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <Alert type="success">Saved successfully.</Alert>
          <Alert type="info">Lessons unlock after you enroll.</Alert>
          <Alert type="warning">Your account is waiting for approval.</Alert>
          <Alert type="error">Something went wrong.</Alert>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <FormField label="Name" placeholder="Your name (any language)" />
          <FormField label="Email" type="email" placeholder="you@example.com" hint="Always left-to-right." />
        </div>
      </Section>

      <Section title="Cards">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard label="Students" value={128} hint="12 new this week" />
          <StatCard label="Courses" value={9} />
          <StatCard label="Pending teachers" value={3} tone="warning" />
          <StatCard label="Completed" value="74%" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <CourseCard title="Wudu Basics" teacher="Teacher One" category="fiqh" lessonCount={4} progress={50} />
          <CourseCard title="أحكام الطهارة" teacher="الأستاذ أحمد" category="fiqh" lessonCount={6} />
          <Card>
            <CardHeader title="Card with header" subtitle="Optional subtitle" action={<Badge tone="green">New</Badge>} />
            <CardBody>
              <ProgressBar value={72} />
            </CardBody>
          </Card>
        </div>
      </Section>

      <Section title="Modals and toasts">
        <div className="flex flex-wrap gap-3">
          <Button onClick={() => setModal(true)}>Open modal</Button>
          <Button variant="danger" onClick={() => setConfirm(true)}>
            Confirm dialog
          </Button>
          <Button variant="outline" onClick={() => toast.success('Course saved.')}>
            Success toast
          </Button>
          <Button variant="outline" onClick={() => toast.error('Could not save the lesson.')}>
            Error toast
          </Button>
          <Button variant="outline" onClick={() => toast.warning('This course is still a draft.')}>
            Warning toast
          </Button>
          <Button variant="outline" onClick={() => toast.info('New lesson added.', { title: 'Heads up' })}>
            Info toast
          </Button>
        </div>
      </Section>

      <Modal
        open={modal}
        onClose={() => setModal(false)}
        title="Edit course"
        footer={
          <>
            <Button variant="outline" onClick={() => setModal(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                setModal(false);
                toast.success('Saved.');
              }}
            >
              Save
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <FormField label="Title" defaultValue="Wudu Basics" />
          <p className="text-sm text-slate-500">Press Escape or click outside to close. Tab stays inside the dialog.</p>
        </div>
      </Modal>

      <ConfirmDialog
        open={confirm}
        danger
        title="Delete this course?"
        message="All lessons and student progress will be removed. This cannot be undone."
        confirmLabel="Delete"
        onCancel={() => setConfirm(false)}
        onConfirm={async () => {
          await new Promise((r) => setTimeout(r, 800));
          setConfirm(false);
          toast.success('Course deleted.');
        }}
      />
    </div>
  );
}
