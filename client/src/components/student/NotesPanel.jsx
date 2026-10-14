import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useFetch } from '../../hooks/useFetch.js';
import { useToast } from '../../hooks/useToast.js';
import { getErrorMessage } from '../../services/api.js';
import { saveNote } from '../../services/studentService.js';
import { formatDateTime } from '../../utils/format.js';
import Alert from '../Alert.jsx';
import Button from '../ui/Button.jsx';
import { ConfirmDialog } from '../ui/Modal.jsx';
import { Skeleton } from '../ui/Skeleton.jsx';
import TextAreaField from '../ui/TextAreaField.jsx';

const MAX = 8000; // same as the server

function NoteEditor({ lessonId, initial }) {
  const { t } = useTranslation();
  const toast = useToast();
  const [text, setText] = useState(initial.content);
  const [saved, setSaved] = useState(initial); // { content, updatedAt } as stored on the server
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const dirty = text.trim() !== saved.content;

  // the browser's own "leave this page?" prompt while there are unsaved words
  useEffect(() => {
    if (!dirty) return undefined;
    const warn = (e) => e.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  async function save(value = text) {
    setSaving(true);
    try {
      const { note } = await saveNote(lessonId, value);
      setSaved(note ?? { content: '', updatedAt: null });
      if (!note) setText('');
      toast.success(note ? t('reader.notes.saved') : t('reader.notes.deleted'));
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  let status = '';
  if (dirty) status = `${t('reader.notes.unsaved')} · `;
  else if (saved.updatedAt) status = `${t('reader.notes.savedAt', { date: formatDateTime(saved.updatedAt) })} · `;

  return (
    <div className="space-y-3">
      <TextAreaField
        label={t('reader.notes.label')}
        hint={t('reader.notes.hint')}
        rows={8}
        value={text}
        maxLength={MAX}
        placeholder={t('reader.notes.placeholder')}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && dirty && !saving) {
            e.preventDefault();
            save();
          }
        }}
      />

      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={() => save()} loading={saving} disabled={!dirty}>
          {t('reader.notes.save')}
        </Button>
        {saved.content && (
          <Button variant="ghost" onClick={() => setConfirmDelete(true)} disabled={saving}>
            {t('reader.notes.delete')}
          </Button>
        )}
        <p className="text-xs text-slate-500 sm:ms-auto" aria-live="polite">
          {status}
          {text.length} / {MAX}
        </p>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        title={t('reader.notes.confirmTitle')}
        message={t('reader.notes.confirmText')}
        confirmLabel={t('reader.notes.delete')}
        danger
        onConfirm={async () => {
          await save('');
          setConfirmDelete(false);
        }}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  );
}

// The student's private note on one lesson
export default function NotesPanel({ lessonId }) {
  const { t } = useTranslation();
  const { data, loading, error } = useFetch(`/lessons/${lessonId}/note`);

  if (loading && !data) return <Skeleton className="h-48 w-full" />;
  if (error || !data) return <Alert>{error || t('reader.notes.loadError')}</Alert>;

  return (
    <NoteEditor
      lessonId={lessonId}
      initial={data.note ?? { content: '', updatedAt: null }}
    />
  );
}