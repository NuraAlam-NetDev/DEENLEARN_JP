import test from 'node:test';
import assert from 'node:assert/strict';
import { PDFDocument } from 'pdf-lib';
import { toPdfText } from '../src/utils/pdfText.js';
import { renderCertificatePdf } from '../src/services/certificatePdf.js';
import { generateCertificateCode } from '../src/services/certificates.js';

test('accents and transliteration marks are folded to printable letters', () => {
  assert.deepEqual(toPdfText("Muḥammad ʿAbd al-Raḥmān Ma'ruf"), { text: "Muhammad 'Abd al-Rahman Ma'ruf", lost: 0 });
  assert.equal(toPdfText('José Müller').text, 'José Müller'); // already printable: untouched
  assert.equal(toPdfText('  a \n\t b  ').text, 'a b');
});

test('Arabic, Bengali and emoji are counted as lost, never thrown', () => {
  assert.equal(toPdfText('محمد').lost, 4);
  assert.equal(toPdfText('Ali محمد').text, 'Ali');
  assert.equal(toPdfText('আব্দুল্লাহ').text, '');
  assert.equal(toPdfText('Ali 😀').lost, 1);
  assert.deepEqual(toPdfText(null), { text: '', lost: 0 });
});

test('certificate codes have the expected shape and do not repeat', () => {
  const codes = new Set(Array.from({ length: 500 }, generateCertificateCode));
  assert.equal(codes.size, 500);
  for (const c of codes) assert.match(c, /^DL-[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}$/);
  assert.equal([...codes].some((c) => /[01OIL]/.test(c.slice(3))), false); // no look-alike characters
});

const base = { issuedAt: new Date('2026-10-05T10:00:00Z'), code: 'DL-7K4Q-X9MD-2PTA', teacherName: 'Ustadh Ibrahim' };

test('renders a one-page PDF', async () => {
  const bytes = await renderCertificatePdf(
    { ...base, recipientName: 'Fatima Rahman', courseTitle: 'Foundations of Fiqh' },
    { verifyUrl: 'http://localhost:5173/verify/DL-7K4Q-X9MD-2PTA' }
  );
  assert.equal(Buffer.from(bytes.slice(0, 5)).toString(), '%PDF-');
  assert.ok(bytes.length > 1000);
  const parsed = await PDFDocument.load(bytes); // proves the file is well-formed
  assert.equal(parsed.getPageCount(), 1);
  assert.match(parsed.getTitle(), /Foundations of Fiqh/);
});

test('never throws on awkward text (non-Latin titles, very long names, no teacher)', async () => {
  for (const c of [
    { recipientName: 'Aisha', courseTitle: 'تجويد القرآن' },
    { recipientName: 'x'.repeat(80), courseTitle: 'Word '.repeat(60) },
    { recipientName: 'Ali', courseTitle: 'y'.repeat(150), teacherName: '' },
    { recipientName: 'Ali', courseTitle: 'Normal', teacherName: 'معلم' },
  ]) {
    const bytes = await renderCertificatePdf({ ...base, ...c });
    assert.equal(Buffer.from(bytes.slice(0, 5)).toString(), '%PDF-');
  }
});
