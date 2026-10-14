import { PDFDocument, StandardFonts, rgb, degrees } from 'pdf-lib';
import { toPdfText } from '../utils/pdfText.js';
import { formatMoney } from '../utils/money.js';

// Same palette as the certificate and the website
const hex = (h) => rgb(parseInt(h.slice(1, 3), 16) / 255, parseInt(h.slice(3, 5), 16) / 255, parseInt(h.slice(5, 7), 16) / 255);
const C = {
  cream: hex('#fbf8f1'),
  green: hex('#136446'),
  greenDark: hex('#07241b'),
  gold: hex('#d4af37'),
  goldDark: hex('#8f7120'),
  ink: hex('#1d2b24'),
  muted: hex('#5b6b63'),
  line: hex('#e6dcc3'),
};

const txt = (s) => toPdfText(s).text;
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const longDate = (d) => {
  const x = new Date(d);
  return `${x.getUTCDate()} ${MONTHS[x.getUTCMonth()]} ${x.getUTCFullYear()}`;
};

function diamond(page, cx, cy, r, color) {
  const half = r / Math.SQRT2;
  page.drawRectangle({ x: cx, y: cy - r, width: half * 2, height: half * 2, rotate: degrees(45), color });
}

function centered(page, text, { font, size, y, color }) {
  const w = font.widthOfTextAtSize(text, size);
  page.drawText(text, { x: (page.getWidth() - w) / 2, y, size, font, color });
}

// A payment receipt in the same style as the certificate: cream page, green and gold frame, a seal and a clear table.
// order: the approved payment. student: { name, email }. course: { title }.
export async function renderReceiptPdf(order, { student, course }) {
  const pdf = await PDFDocument.create();
  const W = 595;
  const H = 842;
  const page = pdf.addPage([W, H]);
  const serif = await pdf.embedFont(StandardFonts.TimesRoman);
  const serifBold = await pdf.embedFont(StandardFonts.TimesRomanBold);
  const serifItalic = await pdf.embedFont(StandardFonts.TimesRomanItalic);
  const sans = await pdf.embedFont(StandardFonts.Helvetica);
  const sansBold = await pdf.embedFont(StandardFonts.HelveticaBold);

  // frame
  page.drawRectangle({ x: 0, y: 0, width: W, height: H, color: C.cream });
  page.drawRectangle({ x: 22, y: 22, width: W - 44, height: H - 44, borderColor: C.green, borderWidth: 4 });
  page.drawRectangle({ x: 32, y: 32, width: W - 64, height: H - 64, borderColor: C.gold, borderWidth: 1.2 });
  diamond(page, 52, 52, 7, C.gold);
  diamond(page, W - 52, 52, 7, C.gold);
  diamond(page, 52, H - 52, 7, C.gold);
  diamond(page, W - 52, H - 52, 7, C.gold);

  // header
  centered(page, 'DEENLEARN', { font: sansBold, size: 11, y: H - 92, color: C.goldDark });
  centered(page, 'Payment Receipt', { font: serifBold, size: 30, y: H - 128, color: C.greenDark });
  page.drawRectangle({ x: W / 2 - 60, y: H - 146, width: 120, height: 1.2, color: C.gold });
  centered(page, 'Thank you for learning with us', { font: serifItalic, size: 12, y: H - 166, color: C.muted });

  // receipt number and date
  const receiptNo = `DL-${String(order._id).slice(-8).toUpperCase()}`;
  const approvedOn = order.reviewedAt ?? order.paidAt ?? order.createdAt;
  page.drawText('RECEIPT NO.', { x: 70, y: H - 210, size: 8, font: sansBold, color: C.muted });
  page.drawText(txt(receiptNo), { x: 70, y: H - 226, size: 13, font: sansBold, color: C.ink });
  const dateLabel = 'DATE';
  page.drawText(dateLabel, { x: W - 70 - sansBold.widthOfTextAtSize(dateLabel, 8), y: H - 210, size: 8, font: sansBold, color: C.muted });
  const dateText = longDate(approvedOn);
  page.drawText(txt(dateText), { x: W - 70 - serif.widthOfTextAtSize(txt(dateText), 13), y: H - 226, size: 13, font: serif, color: C.ink });

  // details table
  let y = H - 268;
  const left = 70;
  const right = W - 70;
  const row = (label, value, { strong = false, valueFont } = {}) => {
    page.drawText(label.toUpperCase(), { x: left, y, size: 8, font: sansBold, color: C.muted });
    const v = txt(value || '-');
    const f = valueFont ?? (strong ? serifBold : serif);
    const size = strong ? 15 : 13;
    page.drawText(v, { x: left, y: y - 17, size, font: f, color: C.ink, maxWidth: right - left });
    page.drawRectangle({ x: left, y: y - 28, width: right - left, height: 0.8, color: C.line });
    y -= 52;
  };
  row('Student', student?.name);
  row('Email', student?.email);
  row('Course', course?.title);
  row('Payment method', order.provider === 'stripe' ? 'Card (Stripe)' : order.provider === 'cash' ? 'Cash to the teacher' : order.provider);

  // amount box
  const boxTop = y - 4;
  page.drawRectangle({ x: left, y: boxTop - 96, width: right - left, height: 96, color: C.greenDark });
  page.drawRectangle({ x: left + 1, y: boxTop - 95, width: right - left - 2, height: 94, borderColor: C.gold, borderWidth: 0.8 });
  page.drawText('AMOUNT PAID', { x: left + 22, y: boxTop - 30, size: 9, font: sansBold, color: C.gold });
  const amount = txt(formatMoney(order.amount, order.currency));
  page.drawText(amount, { x: left + 22, y: boxTop - 68, size: 30, font: serifBold, color: C.cream });
  if (order.discount) {
    const note = `Discount applied: ${formatMoney(order.discount, order.currency)}${order.couponCode ? ` (code ${order.couponCode})` : ''}`;
    const w = sans.widthOfTextAtSize(txt(note), 9);
    page.drawText(txt(note), { x: right - 22 - w, y: boxTop - 68, size: 9, font: sans, color: C.gold });
  }
  y = boxTop - 136;

  // transaction line
  page.drawText('TRANSACTION ID', { x: left, y, size: 8, font: sansBold, color: C.muted });
  page.drawText(txt(order.gatewayTxnId || '-'), { x: left, y: y - 16, size: 10, font: sans, color: C.ink, maxWidth: right - left });

  // seal
  const sealX = W - 130;
  const sealY = 170;
  page.drawCircle({ x: sealX, y: sealY, size: 46, borderColor: C.gold, borderWidth: 2 });
  page.drawCircle({ x: sealX, y: sealY, size: 40, borderColor: C.goldDark, borderWidth: 0.8 });
  const sealText = 'PAID';
  page.drawText(sealText, { x: sealX - serifBold.widthOfTextAtSize(sealText, 18) / 2, y: sealY - 6, size: 18, font: serifBold, color: C.goldDark });

  // footer
  centered(page, 'This receipt confirms that the payment above was approved.', { font: serifItalic, size: 10, y: 92, color: C.muted });
  centered(page, 'Deenlearn', { font: sansBold, size: 9, y: 74, color: C.goldDark });

  return pdf.save();
}
