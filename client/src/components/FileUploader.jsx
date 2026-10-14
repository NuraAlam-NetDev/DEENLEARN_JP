import { useEffect, useRef, useState } from 'react';
import { getErrorMessage } from '../services/api.js';
import { formatBytes } from '../utils/format.js';
import Button from './ui/Button.jsx';
import Icon from './ui/Icon.jsx';

function matchesAccept(file, accept) {
  if (!file.type) return true; // unknown type: let the server decide (it checks the real bytes)
  return accept
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean)
    .some((t) => (t.endsWith('/*') ? file.type.startsWith(t.slice(0, -1)) : file.type === t));
}

// Upload box with per-file progress and cancel. Files go up one at a time.
//   onUpload(file, { onProgress, signal }) -> Promise   (throw to show an error under that file)
// The server stays the authority on type and size; checks here are only for quick feedback.
export default function FileUploader({
  onUpload,
  accept = 'image/*,application/pdf,audio/*',
  maxMB = 10,
  multiple = true,
  disabled = false,
  label = 'Choose files',
  hint,
}) {
  const inputRef = useRef(null);
  const controllers = useRef(new Map());
  const mounted = useRef(true);
  const nextId = useRef(1);
  const [items, setItems] = useState([]);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    mounted.current = true;
    const running = controllers.current;
    return () => {
      mounted.current = false;
      running.forEach((c) => c.abort()); // leaving the page cancels unfinished uploads
    };
  }, []);

  const busy = items.some((i) => i.status === 'uploading' || i.status === 'processing');
  const patch = (id, changes) =>
    mounted.current && setItems((list) => list.map((i) => (i.id === id ? { ...i, ...changes } : i)));
  const remove = (id) => mounted.current && setItems((list) => list.filter((i) => i.id !== id));

  async function uploadOne(file) {
    const id = nextId.current++;
    const base = { id, name: file.name, progress: 0 };

    if (file.size > maxMB * 1024 * 1024) {
      setItems((l) => [...l, { ...base, status: 'error', error: `${formatBytes(file.size)} is over the ${maxMB} MB limit.` }]);
      return;
    }
    if (!matchesAccept(file, accept)) {
      setItems((l) => [...l, { ...base, status: 'error', error: 'This file type is not allowed here.' }]);
      return;
    }

    const controller = new AbortController();
    controllers.current.set(id, controller);
    setItems((l) => [...l, { ...base, status: 'uploading' }]);

    try {
      await onUpload(file, {
        signal: controller.signal,
        // 100% only means the browser finished sending; the server still stores the file
        onProgress: (pct) => patch(id, { progress: pct, status: pct >= 100 ? 'processing' : 'uploading' }),
      });
      remove(id);
    } catch (err) {
      if (err?.code === 'ERR_CANCELED') remove(id);
      else patch(id, { status: 'error', error: getErrorMessage(err) });
    } finally {
      controllers.current.delete(id);
    }
  }

  async function handleFiles(fileList) {
    const files = Array.from(fileList || []);
    for (const file of files) {
      if (!mounted.current) return;
      // one at a time on purpose: uploads to the same lesson must not overlap
      await uploadOne(file);
    }
  }

  const locked = disabled || busy;

  return (
    <div>
      <div
        onDragOver={(e) => {
          if (locked) return;
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          if (!locked) handleFiles(multiple ? e.dataTransfer.files : [e.dataTransfer.files[0]].filter(Boolean));
        }}
        className={`flex flex-col items-center gap-2 rounded-xl border-2 border-dashed p-5 text-center transition-colors ${
          dragging ? 'border-brand-600 bg-brand-50' : 'border-brand-200 bg-white'
        }`}
      >
        <Icon name="upload" className="h-6 w-6 text-brand-600" />
        <Button variant="outline" size="sm" onClick={() => inputRef.current?.click()} disabled={locked}>
          {label}
        </Button>
        <p className="text-xs text-slate-500">
          or drop {multiple ? 'files' : 'a file'} here{hint ? ` · ${hint}` : ''} · max {maxMB} MB each
        </p>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          className="sr-only"
          tabIndex={-1}
          onChange={(e) => {
            const picked = e.target.files;
            handleFiles(picked); // copies the file list before its first await
            e.target.value = ''; // allow choosing the same file again
          }}
        />
      </div>

      {items.length > 0 && (
        <ul className="mt-3 space-y-2" aria-live="polite">
          {items.map((item) => (
            <li key={item.id} className="rounded-lg border border-brand-100 bg-white p-3 text-sm">
              <div className="flex items-center justify-between gap-3">
                <span className="min-w-0 truncate font-medium text-slate-700" dir="auto">
                  {item.name}
                </span>
                {item.status === 'error' ? (
                  <Button variant="ghost" size="sm" onClick={() => remove(item.id)}>
                    Dismiss
                  </Button>
                ) : (
                  <Button variant="ghost" size="sm" onClick={() => controllers.current.get(item.id)?.abort()}>
                    Cancel
                  </Button>
                )}
              </div>
              {item.status === 'error' ? (
                <p className="mt-1 text-xs text-red-600">{item.error}</p>
              ) : (
                <>
                  <div
                    className="mt-2 h-2 overflow-hidden rounded-full bg-brand-100"
                    role="progressbar"
                    aria-valuenow={item.progress}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`Uploading ${item.name}`}
                  >
                    <div
                      className={`h-full rounded-full bg-brand-600 transition-all ${
                        item.status === 'processing' ? 'animate-pulse' : ''
                      }`}
                      style={{ width: `${item.progress}%` }}
                    />
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    {item.status === 'processing' ? 'Saving…' : `${item.progress}%`}
                  </p>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
