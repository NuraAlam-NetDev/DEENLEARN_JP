import { PDFDocument, StandardFonts, rgb, degrees } from 'pdf-lib';
import { toPdfText } from '../utils/pdfText.js';
import QRCode from 'qrcode';

const [W, H] = [841.89, 595.28]; // A4 landscape, in points

const hex = (h) => rgb(parseInt(h.slice(1, 3), 16) / 255, parseInt(h.slice(3, 5), 16) / 255, parseInt(h.slice(5, 7), 16) / 255);
// Same palette as the website (client/src/index.css)
const COLOR = {
  cream: hex('#fbf8f1'),
  green: hex('#136446'),
  greenDark: hex('#07241b'),
  gold: hex('#d4af37'),
  goldDark: hex('#8f7120'),
  ink: hex('#1d2b24'),
  muted: hex('#5b6b63'),
};

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const formatDate = (d) => {
  const date = new Date(d);
  return `${date.getUTCDate()} ${MONTHS[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
};

// Break text into lines no wider than maxWidth. A single over-long word is split by character.
function wrap(text, font, size, maxWidth) {
  const width = (s) => font.widthOfTextAtSize(s, size);
  const lines = [];
  let line = '';
  for (const word of text.split(' ')) {
    const attempt = line ? `${line} ${word}` : word;
    if (width(attempt) <= maxWidth) {
      line = attempt;
      continue;
    }
    if (line) lines.push(line);
    line = '';
    let rest = word;
    while (width(rest) > maxWidth) {
      let cut = rest.length - 1;
      while (cut > 1 && width(rest.slice(0, cut)) > maxWidth) cut -= 1;
      lines.push(rest.slice(0, cut));
      rest = rest.slice(cut);
    }
    line = rest;
  }
  if (line) lines.push(line);
  return lines;
}

// Largest font size (from max down to min) at which the text fits on `maxLines` lines.
// If even the smallest size does not fit, the last line is cut with an ellipsis.
function fitLines(text, font, { max, min, maxWidth, maxLines }) {
  for (let size = max; size >= min; size -= 1) {
    const lines = wrap(text, font, size, maxWidth);
    if (lines.length <= maxLines) return { size, lines };
  }
  const lines = wrap(text, font, min, maxWidth).slice(0, maxLines);
  let last = lines[maxLines - 1];
  while (last.length > 1 && font.widthOfTextAtSize(`${last}…`, min) > maxWidth) last = last.slice(0, -1);
  lines[maxLines - 1] = `${last}…`;
  return { size: min, lines };
}

function centered(page, text, { font, size, y, color }) {
  const x = (W - font.widthOfTextAtSize(text, size)) / 2;
  page.drawText(text, { x, y, size, font, color });
}

// Capital letters with extra space between them (pdf-lib has no letter-spacing option)
function centeredSpaced(page, text, { font, size, y, color, spacing }) {
  const chars = [...text];
  const total = chars.reduce((sum, c) => sum + font.widthOfTextAtSize(c, size), 0) + spacing * (chars.length - 1);
  let x = (W - total) / 2;
  for (const c of chars) {
    page.drawText(c, { x, y, size, font, color });
    x += font.widthOfTextAtSize(c, size) + spacing;
  }
}

function diamond(page, cx, cy, r, color) {
  // a square turned 45 degrees; drawRectangle rotates around its bottom-left corner
  const half = r / Math.SQRT2;
  page.drawRectangle({ x: cx, y: cy - r, width: half * 2, height: half * 2, rotate: degrees(45), color });
}

// Builds the certificate PDF. `certificate` needs: recipientName, courseTitle, teacherName, issuedAt, code.
// Returns a Uint8Array. Text is reduced to what the built-in fonts can print (see utils/pdfText.js).
export async function renderCertificatePdf(certificate, { verifyUrl = '' } = {}) {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([W, H]);

  const [serif, serifBold, serifBoldItalic, serifItalic, sans, sansBold] = await Promise.all([
    pdf.embedFont(StandardFonts.TimesRoman),
    pdf.embedFont(StandardFonts.TimesRomanBold),
    pdf.embedFont(StandardFonts.TimesRomanBoldItalic),
    pdf.embedFont(StandardFonts.TimesRomanItalic),
    pdf.embedFont(StandardFonts.Helvetica),
    pdf.embedFont(StandardFonts.HelveticaBold),
  ]);

  const name = toPdfText(certificate.recipientName).text || 'Student';
  const title = toPdfText(certificate.courseTitle).text || 'Online course';
  const teacher = toPdfText(certificate.teacherName).text;
  const code = toPdfText(certificate.code).text;

  // ---- Frame ----
  page.drawRectangle({ x: 0, y: 0, width: W, height: H, color: COLOR.cream });
  page.drawRectangle({ x: 22, y: 22, width: W - 44, height: H - 44, borderColor: COLOR.green, borderWidth: 4 });
  page.drawRectangle({ x: 32, y: 32, width: W - 64, height: H - 64, borderColor: COLOR.gold, borderWidth: 1.2 });
  for (const [cx, cy] of [[32, 32], [W - 32, 32], [32, H - 32], [W - 32, H - 32]]) {
    diamond(page, cx, cy, 9, COLOR.gold);
  }

  // ---- Heading ----
  centeredSpaced(page, 'DEENLEARN', { font: sansBold, size: 13, y: H - 92, color: COLOR.goldDark, spacing: 5 });
  centered(page, 'Certificate of Completion', { font: serifBold, size: 40, y: H - 140, color: COLOR.green });

  // gold rule with a diamond in the middle
  const ruleY = H - 160;
  page.drawLine({ start: { x: W / 2 - 150, y: ruleY }, end: { x: W / 2 - 14, y: ruleY }, thickness: 1.2, color: COLOR.gold });
  page.drawLine({ start: { x: W / 2 + 14, y: ruleY }, end: { x: W / 2 + 150, y: ruleY }, thickness: 1.2, color: COLOR.gold });
  diamond(page, W / 2, ruleY, 5, COLOR.gold);

  // ---- Body ----
  centered(page, 'This is to certify that', { font: serifItalic, size: 16, y: H - 200, color: COLOR.muted });

  const nameFit = fitLines(name, serifBoldItalic, { max: 44, min: 22, maxWidth: W - 200, maxLines: 1 });
  const nameY = H - 250;
  centered(page, nameFit.lines[0], { font: serifBoldItalic, size: nameFit.size, y: nameY, color: COLOR.ink });
  const nameWidth = serifBoldItalic.widthOfTextAtSize(nameFit.lines[0], nameFit.size);
  const underline = Math.max(nameWidth + 60, 320);
  page.drawLine({
    start: { x: (W - underline) / 2, y: nameY - 10 },
    end: { x: (W + underline) / 2, y: nameY - 10 },
    thickness: 0.8,
    color: COLOR.gold,
  });

  centered(page, 'has successfully completed the course', { font: serifItalic, size: 16, y: nameY - 40, color: COLOR.muted });

  const titleFit = fitLines(title, serifBold, { max: 28, min: 18, maxWidth: W - 200, maxLines: 3 });
  const lineHeight = titleFit.size * 1.25;
  let ty = nameY - 78;
  for (const line of titleFit.lines) {
    centered(page, line, { font: serifBold, size: titleFit.size, y: ty, color: COLOR.green });
    ty -= lineHeight;
  }

  if (teacher) {
    centered(page, `Taught by ${teacher}`, { font: serif, size: 14, y: ty - 6, color: COLOR.muted });
  }

  // ---- Footer: date | seal | certificate ID ----
  const footY = 92;
  const colLeft = 110;
  const colRight = W - 110;

  page.drawLine({ start: { x: colLeft, y: footY + 22 }, end: { x: colLeft + 200, y: footY + 22 }, thickness: 0.8, color: COLOR.muted });
  page.drawText(formatDate(certificate.issuedAt), { x: colLeft, y: footY + 28, size: 14, font: serif, color: COLOR.ink });
  page.drawText('DATE OF ISSUE', { x: colLeft, y: footY + 8, size: 8.5, font: sansBold, color: COLOR.muted });

  const idWidth = sansBold.widthOfTextAtSize(code, 12);
  page.drawLine({ start: { x: colRight - 200, y: footY + 22 }, end: { x: colRight, y: footY + 22 }, thickness: 0.8, color: COLOR.muted });
  page.drawText(code, { x: colRight - idWidth, y: footY + 28, size: 12, font: sansBold, color: COLOR.ink });
  page.drawText('CERTIFICATE ID', { x: colRight - sansBold.widthOfTextAtSize('CERTIFICATE ID', 8.5), y: footY + 8, size: 8.5, font: sansBold, color: COLOR.muted });

  // seal
  const sealY = footY + 28;
  page.drawCircle({ x: W / 2, y: sealY, size: 36, color: COLOR.gold });
  page.drawCircle({ x: W / 2, y: sealY, size: 30, borderColor: COLOR.cream, borderWidth: 1.5 });
  page.drawLine({ start: { x: W / 2 - 12, y: sealY - 1 }, end: { x: W / 2 - 3, y: sealY - 10 }, thickness: 4, color: COLOR.greenDark });
  page.drawLine({ start: { x: W / 2 - 3, y: sealY - 10 }, end: { x: W / 2 + 14, y: sealY + 11 }, thickness: 4, color: COLOR.greenDark });

  if (verifyUrl) {
    // QR code: scanning it opens the public verification page
    const qrPng = await QRCode.toBuffer(verifyUrl, { type: 'png', width: 240, margin: 1 });
    const qr = await pdf.embedPng(qrPng);
    const { width: pageW } = page.getSize();
    page.drawImage(qr, { x: pageW - 150, y: 40, width: 96, height: 96 });
    page.drawText('Scan to verify', { x: pageW - 150, y: 28, size: 7, font: sans, color: COLOR.muted });
    const text = `Verify this certificate at ${toPdfText(verifyUrl).text}`;
    const size = 9;
    page.drawText(text, { x: (W - sans.widthOfTextAtSize(text, size)) / 2, y: 46, size, font: sans, color: COLOR.muted });
  }

  pdf.setTitle(`Certificate of Completion - ${title}`);
  pdf.setAuthor('Deenlearn');
  pdf.setSubject(`Issued to ${name}`);
  pdf.setProducer('Deenlearn');
  pdf.setCreationDate(new Date(certificate.issuedAt));

  return pdf.save();
}
