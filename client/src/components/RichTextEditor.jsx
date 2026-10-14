import { useEffect } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import { toHtml } from '../utils/richText.js';

function ToolButton({ label, active = false, disabled = false, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      aria-pressed={active}
      className={`h-9 min-w-9 rounded-md px-2 text-sm font-semibold transition-colors disabled:opacity-40 ${
        active ? 'bg-brand-700 text-white' : 'text-brand-800 hover:bg-brand-50'
      }`}
    >
      {children}
    </button>
  );
}

// Rich-text lesson editor (TipTap). Emits HTML through onChange ('' when empty).
// Mount it AFTER the lesson has loaded: `value` is only read once, as the starting content.
// The server sanitizes the HTML again on save, so this is a convenience, not a security layer.
export default function RichTextEditor({ value = '', onChange, disabled = false, label = 'Lesson content' }) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3] } }),
      Underline,
      Link.configure({ openOnClick: false, autolink: true }),
    ],
    content: toHtml(value),
    editable: !disabled,
    editorProps: {
      attributes: {
        class: 'rich-content min-h-64 px-4 py-3 outline-none',
        role: 'textbox',
        'aria-multiline': 'true',
        'aria-label': label,
      },
    },
    onUpdate: ({ editor: ed }) => onChange?.(ed.isEmpty ? '' : ed.getHTML()),
  });

  useEffect(() => {
    editor?.setEditable(!disabled);
  }, [editor, disabled]);

  if (!editor) return null;

  function setLink() {
    const previous = editor.getAttributes('link').href || '';
    const input = window.prompt('Link address (https://…). Leave empty to remove the link.', previous);
    if (input === null) return;
    const url = input.trim();
    if (!url) {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    const href = /^(https?:|mailto:)/i.test(url) ? url : `https://${url}`;
    editor.chain().focus().extendMarkRange('link').setLink({ href }).run();
  }

  const chain = () => editor.chain().focus();

  return (
    <div className="overflow-hidden rounded-lg border border-brand-200 bg-white focus-within:border-brand-600 focus-within:ring-2 focus-within:ring-brand-600/20">
      <div className="flex flex-wrap gap-1 border-b border-brand-100 bg-brand-50/50 p-1.5" role="toolbar" aria-label="Formatting">
        <ToolButton label="Bold" active={editor.isActive('bold')} onClick={() => chain().toggleBold().run()}>
          <span className="font-bold">B</span>
        </ToolButton>
        <ToolButton label="Italic" active={editor.isActive('italic')} onClick={() => chain().toggleItalic().run()}>
          <span className="italic">I</span>
        </ToolButton>
        <ToolButton label="Underline" active={editor.isActive('underline')} onClick={() => chain().toggleUnderline().run()}>
          <span className="underline">U</span>
        </ToolButton>
        <ToolButton label="Heading" active={editor.isActive('heading', { level: 2 })} onClick={() => chain().toggleHeading({ level: 2 }).run()}>
          H2
        </ToolButton>
        <ToolButton label="Subheading" active={editor.isActive('heading', { level: 3 })} onClick={() => chain().toggleHeading({ level: 3 }).run()}>
          H3
        </ToolButton>
        <ToolButton label="Bulleted list" active={editor.isActive('bulletList')} onClick={() => chain().toggleBulletList().run()}>
          • List
        </ToolButton>
        <ToolButton label="Numbered list" active={editor.isActive('orderedList')} onClick={() => chain().toggleOrderedList().run()}>
          1. List
        </ToolButton>
        <ToolButton label="Quote" active={editor.isActive('blockquote')} onClick={() => chain().toggleBlockquote().run()}>
          ❝
        </ToolButton>
        <ToolButton label="Link" active={editor.isActive('link')} onClick={setLink}>
          Link
        </ToolButton>
        <span className="mx-1 w-px self-stretch bg-brand-100" aria-hidden="true" />
        <ToolButton label="Undo" disabled={!editor.can().undo()} onClick={() => chain().undo().run()}>
          ↶
        </ToolButton>
        <ToolButton label="Redo" disabled={!editor.can().redo()} onClick={() => chain().redo().run()}>
          ↷
        </ToolButton>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
