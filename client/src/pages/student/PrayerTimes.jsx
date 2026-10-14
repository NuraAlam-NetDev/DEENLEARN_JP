import { useEffect, useState } from 'react';
import { Card } from '../../components/ui/Card.jsx';

// Dhaka, used when the browser does not share a location
const FALLBACK = { lat: 23.8103, lon: 90.4125, label: 'Dhaka (default)' };
const METHODS = [
  { id: 1, name: 'University of Islamic Sciences, Karachi' },
  { id: 3, name: 'Muslim World League' },
  { id: 2, name: 'ISNA (North America)' },
  { id: 4, name: 'Umm al-Qura (Makkah)' },
];
const ORDER = ['Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];

const pad = (n) => String(n).padStart(2, '0');
const dateParam = (d) => `${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()}`;
const clock = (s) => String(s).split(' ')[0]; // "05:12 (+06)" -> "05:12"
const toMinutes = (hhmm) => { const [h, m] = hhmm.split(':').map(Number); return h * 60 + m; };

// Prayer times for today at a location (Aladhan public API). Needs internet once per day.
export default function PrayerTimes() {
  const [pos, setPos] = useState(null);
  const [method, setMethod] = useState(1);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    if (!navigator.geolocation) { setPos(FALLBACK); return; }
    navigator.geolocation.getCurrentPosition(
      (p) => setPos({ lat: p.coords.latitude, lon: p.coords.longitude, label: 'Your location' }),
      () => setPos(FALLBACK),
      { maximumAge: 3600000, timeout: 8000 }
    );
  }, []);

  useEffect(() => {
    if (!pos) return;
    setData(null);
    setError('');
    const url = `https://api.aladhan.com/v1/timings/${dateParam(new Date())}?latitude=${pos.lat}&longitude=${pos.lon}&method=${method}`;
    fetch(url)
      .then((r) => r.json())
      .then((json) => setData(json.data))
      .catch(() => setError('Prayer times could not be loaded. Check your internet connection.'));
  }, [pos, method]);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

  const nowMin = now.getHours() * 60 + now.getMinutes();
  const times = data ? ORDER.map((name) => ({ name, time: clock(data.timings[name]) })) : [];
  const next = times.find((t) => toMinutes(t.time) > nowMin) ?? times[0];
  const hijri = data?.date?.hijri;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-3xl font-bold text-brand-800">Prayer times</h1>
        <p className="mt-1 text-slate-600">{pos?.label ?? 'Finding your location…'}</p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <label className="text-sm text-slate-700">
          Calculation method{' '}
          <select value={method} onChange={(e) => setMethod(Number(e.target.value))}
            className="h-10 rounded-lg border border-brand-200 bg-white px-3 text-sm">
            {METHODS.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        </label>
      </div>

      {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {!data && !error && <p className="text-sm text-slate-500">Loading…</p>}

      {data && (
        <>
          <Card className="space-y-1 p-5">
            <p className="text-sm text-slate-500">{data.date.readable}</p>
            {hijri && <p className="font-display text-lg text-brand-800">{hijri.day} {hijri.month.en} {hijri.year} AH</p>}
            <p className="pt-2 text-sm text-slate-700">Next: <span className="font-semibold text-brand-800">{next.name}</span> at {next.time}</p>
          </Card>

          <ul className="grid gap-3 sm:grid-cols-2">
            {times.map((t) => (
              <li key={t.name}>
                <Card className={`flex items-center justify-between p-4 ${t.name === next.name ? 'border-2 border-brand-600' : ''}`}>
                  <span className="font-semibold text-slate-800">{t.name}</span>
                  <span className="font-display text-2xl text-brand-800" dir="ltr">{t.time}</span>
                </Card>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
