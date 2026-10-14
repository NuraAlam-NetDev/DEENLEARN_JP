import { useState } from 'react';
import { getTheme, setTheme } from '../../utils/theme.js';

// Light / dark / device setting. Works on every page, logged in or not.
export default function ThemeToggle() {
  const [mode, setMode] = useState(getTheme);

  function change(e) {
    setMode(e.target.value);
    setTheme(e.target.value);
  }

  return (
    <label className="inline-flex items-center gap-2 text-sm text-slate-700">
      <span className="sr-only sm:not-sr-only">Theme</span>
      <select
        value={mode}
        onChange={change}
        aria-label="Theme"
        className="h-9 rounded-lg border border-brand-200 bg-white px-2 text-sm text-slate-800"
      >
        <option value="system">Device</option>
        <option value="light">Light</option>
        <option value="dark">Dark</option>
      </select>
    </label>
  );
}
