// Light, dark, or follow the device. The choice is kept on this device.
const KEY = 'deenlearn-theme';

export function getTheme() {
  try { return localStorage.getItem(KEY) || 'system'; } catch { return 'system'; }
}

export function applyTheme(mode) {
  const dark = mode === 'dark' || (mode === 'system' && window.matchMedia?.('(prefers-color-scheme: dark)').matches);
  document.documentElement.classList.toggle('dark', !!dark);
}

export function setTheme(mode) {
  try { localStorage.setItem(KEY, mode); } catch { /* private mode: keep it for this visit only */ }
  applyTheme(mode);
}
