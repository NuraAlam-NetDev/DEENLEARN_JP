const BASE = import.meta.env.VITE_API_URL || '';

export async function api(path, options = {}) {
  const res = await fetch(`${BASE}/api${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options.headers },
  });
  const data = await res.json().catch(() => ({}));
  // 503 from /health still carries a useful JSON body
  if (!res.ok && res.status !== 503) throw new Error(data.message || res.statusText);
  return data;
}
