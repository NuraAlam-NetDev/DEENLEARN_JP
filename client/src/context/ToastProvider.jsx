import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ToastContext } from './toastContext.js';
import ToastViewport from '../components/ui/ToastViewport.jsx';

const MAX_VISIBLE = 4;

export default function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timers = useRef(new Map());
  const counter = useRef(0);

  const dismiss = useCallback((id) => {
    clearTimeout(timers.current.get(id));
    timers.current.delete(id);
    setToasts((list) => list.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (type, message, options = {}) => {
      counter.current += 1;
      const id = counter.current;
      const duration = options.duration ?? (type === 'error' ? 6000 : 4000); // 0 = stay until dismissed

      setToasts((list) => [...list.slice(-(MAX_VISIBLE - 1)), { id, type, message, title: options.title }]);
      if (duration > 0) timers.current.set(id, setTimeout(() => dismiss(id), duration));
      return id;
    },
    [dismiss]
  );

  useEffect(() => {
    const active = timers.current;
    return () => active.forEach((timer) => clearTimeout(timer));
  }, []);

  const api = useMemo(
    () => ({
      success: (message, options) => push('success', message, options),
      error: (message, options) => push('error', message, options),
      warning: (message, options) => push('warning', message, options),
      info: (message, options) => push('info', message, options),
      dismiss,
    }),
    [push, dismiss]
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <ToastViewport toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}
