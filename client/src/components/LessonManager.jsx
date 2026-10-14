import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { getErrorMessage } from '../services/api.js';
import { deleteLesson, reorderLessons } from '../services/teacherService.js';
import { useToast } from '../hooks/useToast.js';
import Button, { ButtonLink } from './ui/Button.jsx';
import { Card } from './ui/Card.jsx';
import EmptyState from './ui/EmptyState.jsx';
import Icon from './ui/Icon.jsx';
import { ConfirmDialog } from './ui/Modal.jsx';

function LessonRow({ lesson, index, courseId, disabled, onDelete }) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } =
    useSortable({ id: lesson._id, disabled });

  const files = lesson.attachments?.length ?? 0;

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={isDragging ? 'relative z-10' : undefined}
    >
      <Card className={`flex items-center gap-3 p-3 ${isDragging ? 'shadow-lg ring-2 ring-gold-400' : ''}`}>
        <button
          type="button"
          ref={setActivatorNodeRef}
          disabled={disabled}
          aria-label={`Reorder lesson ${index + 1}: ${lesson.title}. Press space, then use the arrow keys.`}
          className="shrink-0 cursor-grab touch-none rounded-md p-2 text-slate-400 hover:bg-brand-50 hover:text-brand-700 active:cursor-grabbing disabled:cursor-not-allowed disabled:opacity-40"
          {...attributes}
          {...listeners}
        >
          <Icon name="grip" className="h-5 w-5" />
        </button>

        <span className="w-6 shrink-0 text-center text-sm font-semibold text-slate-400">{index + 1}</span>

        <div className="min-w-0 flex-1">
          <Link
            to={`/teacher/courses/${courseId}/lessons/${lesson._id}`}
            dir="auto"
            className="block truncate font-semibold text-brand-800 hover:text-brand-600"
          >
            {lesson.title}
          </Link>
          {files > 0 && (
            <p className="text-xs text-slate-500">
              {files} file{files === 1 ? '' : 's'}
            </p>
          )}
        </div>

        <ButtonLink
          to={`/teacher/courses/${courseId}/lessons/${lesson._id}/quiz`}
          variant="ghost"
          size="sm"
          aria-label={`Quiz for ${lesson.title}`}
        >
          <Icon name="clipboard" className="h-4 w-4" />
          <span className="hidden sm:inline">Quiz</span>
        </ButtonLink>
        <ButtonLink
          to={`/teacher/courses/${courseId}/lessons/${lesson._id}/discussion`}
          variant="ghost"
          size="sm"
          aria-label={`Questions about ${lesson.title}`}
        >
          <Icon name="message" className="h-4 w-4" />
          <span className="hidden sm:inline">Q&amp;A</span>
        </ButtonLink>
        <ButtonLink
          to={`/teacher/courses/${courseId}/lessons/${lesson._id}`}
          variant="ghost"
          size="sm"
          aria-label={`Edit ${lesson.title}`}
        >
          <Icon name="edit" className="h-4 w-4" />
          <span className="hidden sm:inline">Edit</span>
        </ButtonLink>
        <Button variant="ghost" size="sm" onClick={() => onDelete(lesson)} aria-label={`Delete ${lesson.title}`}>
          <Icon name="trash" className="h-4 w-4 text-red-600" />
        </Button>
      </Card>
    </li>
  );
}

// Drag to reorder (mouse, touch or keyboard). The new order is saved right away and rolled
// back if the server refuses. Mount after the lessons have loaded: they are the starting list.
export default function LessonManager({ courseId, initialLessons, onChanged }) {
  const toast = useToast();
  const [items, setItems] = useState(initialLessons);
  const [saving, setSaving] = useState(false);
  const [toDelete, setToDelete] = useState(null);

  const sensors = useSensors(
    // small distance so a normal click or scroll never starts a drag
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  async function handleDragEnd({ active, over }) {
    if (!over || active.id === over.id) return;
    const from = items.findIndex((l) => l._id === active.id);
    const to = items.findIndex((l) => l._id === over.id);
    if (from < 0 || to < 0) return;

    const previous = items;
    const next = arrayMove(items, from, to);
    setItems(next); // optimistic
    setSaving(true);
    try {
      await reorderLessons(courseId, next.map((l) => l._id));
      toast.success('Lesson order saved');
    } catch (err) {
      setItems(previous);
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    const lesson = toDelete;
    try {
      await deleteLesson(lesson._id);
      setItems((list) => list.filter((l) => l._id !== lesson._id));
      toast.success('Lesson deleted');
      onChanged?.();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setToDelete(null);
    }
  }

  if (items.length === 0) {
    return (
      <EmptyState
        title="No lessons yet"
        text="Add your first lesson. A course needs at least one lesson before it can be published."
        action={
          <ButtonLink to={`/teacher/courses/${courseId}/lessons/new`}>
            <Icon name="plus" className="h-4 w-4" />
            Add lesson
          </ButtonLink>
        }
      />
    );
  }

  return (
    <>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={items.map((l) => l._id)} strategy={verticalListSortingStrategy}>
          <ol className="space-y-2" aria-label="Lessons">
            {items.map((lesson, index) => (
              <LessonRow
                key={lesson._id}
                lesson={lesson}
                index={index}
                courseId={courseId}
                disabled={saving}
                onDelete={setToDelete}
              />
            ))}
          </ol>
        </SortableContext>
      </DndContext>

      <ConfirmDialog
        open={!!toDelete}
        title="Delete this lesson?"
        message={`“${toDelete?.title ?? ''}” and its uploaded files will be removed. Its quiz, students' progress, notes and questions are deleted too.`}
        confirmLabel="Delete lesson"
        danger
        onConfirm={handleDelete}
        onCancel={() => setToDelete(null)}
      />
    </>
  );
}
