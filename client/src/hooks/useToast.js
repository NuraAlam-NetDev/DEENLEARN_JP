import { useContext } from 'react';
import { ToastContext } from '../context/toastContext.js';

// const toast = useToast(); toast.success('Saved'); toast.error('Something failed');
export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
}
