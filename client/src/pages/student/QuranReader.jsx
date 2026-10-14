import { useEffect, useMemo, useState } from 'react';
import { Card } from '../../components/ui/Card.jsx';

const AUDIO = (n) => `https://cdn.islamic.network/quran/audio-surah/128/ar.alafasy/${n}.mp3`;

// The Quran: the 114 surahs, Arabic text with an English translation, and audio (Mishary Alafasy).
// Text is kept by the app's offline cache once you have opened a surah.
export default function QuranReader() {
  const [surahs, setSurahs] = useState(null);
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(null);      // surah number
  const [ayahs, setAyahs] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('https://api.alquran.cloud/v1/surah')
      .then((r) => r.json())
      .then((j) => setSurahs(j.data))
      .catch(() => setError('The surah list could not be loaded. Check your internet connection.'));
  }, []);

  useEffect(() => {
    if (!open) return;
    setAyahs(null);
    setError('');
    fetch(`https://api.alquran.cloud/v1/surah/${open}/editions/quran-uthmani,en.asad`)
      .then((r) => r.json())
      .then((j) => {
        const [arabic, english] = j.data;
        setAyahs(arabic.ayahs.map((a, i) => ({ number: a.numberInSurah, arabic: a.text, english: english.ayahs[i]?.text ?? '' })));
      })
      .catch(() => setError('This surah could not be loaded. Check your internet connection.'));
  }, [open]);

  const shown = useMemo(() => {
    if (!surahs) return [];
    const q = query.trim().toLowerCase();
    if (!q) return surahs;
    return surahs.filter((s) =>
      s.englishName.toLowerCase().includes(q) || s.englishNameTranslation.toLowerCase().includes(q) || String(s.number) === q
    );
  }, [surahs, query]);

  if (open) {
    const info = surahs?.find((s) => s.number === open);
    return (
      <div className="space-y-5">
        <button type="button" onClick={() => setOpen(null)} className="text-sm font-semibold text-brand-700 hover:underline">
          ← All surahs
        </button>
        <div>
          <h1 className="font-display text-3xl font-bold text-brand-800" dir="rtl">{info?.name}</h1>
          <p className="mt-1 text-slate-600">{info?.englishName} · {info?.englishNameTranslation} · {info?.numberOfAyahs} ayahs</p>
        </div>
        <audio controls preload="none" src={AUDIO(open)} className="w-full" />
        {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        {!ayahs && !error && <p className="text-sm text-slate-500">Loading…</p>}
        <ol className="space-y-4">
          {ayahs?.map((a) => (
            <li key={a.number} className="border-b border-brand-50 pb-4">
              <p className="text-end font-arabic text-2xl leading-loose text-slate-900" dir="rtl" lang="ar">
                {a.arabic} <span className="text-sm text-brand-700">({a.number})</span>
              </p>
              <p className="mt-2 text-sm text-slate-700" dir="ltr">{a.english}</p>
            </li>
          ))}
        </ol>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-3xl font-bold text-brand-800">Quran</h1>
        <p className="mt-1 text-slate-600">Choose a surah. Once opened, it can be read offline.</p>
      </div>
      <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by name or number"
        className="h-10 w-full rounded-lg border border-brand-200 bg-white px-3 text-sm sm:max-w-xs" />
      {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {!surahs && !error && <p className="text-sm text-slate-500">Loading…</p>}
      <ul className="grid gap-2 sm:grid-cols-2">
        {shown.map((s) => (
          <li key={s.number}>
            <button type="button" onClick={() => setOpen(s.number)} className="w-full text-start">
              <Card className="flex items-center justify-between p-3 hover:bg-brand-50">
                <span>
                  <span className="font-semibold text-slate-800">{s.number}. {s.englishName}</span>
                  <span className="block text-xs text-slate-500">{s.englishNameTranslation} · {s.numberOfAyahs} ayahs</span>
                </span>
                <span className="font-arabic text-xl text-brand-800" dir="rtl">{s.name}</span>
              </Card>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
