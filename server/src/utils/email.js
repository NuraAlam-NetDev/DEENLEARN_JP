import EmailLog from '../models/EmailLog.js';

// Sends an email (SMTP when configured) and always writes a row to the email log.
// Without SMTP the email is only printed to the server console and logged as "skipped".
// Never throws: a failed email must not break the action that caused it.
export async function sendEmail({ to, subject, text, kind = 'system', userId = null, sentBy = null, sentByRole = '', planId = null }) {
  let status = 'sent';
  let error = '';
  try {
    if (!process.env.SMTP_HOST) {
      status = 'skipped';
      error = 'SMTP is not configured';
      console.log(`\n[email not sent: SMTP is not configured]\nTo: ${to}\nSubject: ${subject}\n${text}\n`);
    } else {
      const nodemailer = (await import('nodemailer')).default;
      const transport = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT || 587),
        secure: Number(process.env.SMTP_PORT) === 465,
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
      });
      await transport.sendMail({ from: process.env.SMTP_FROM || process.env.SMTP_USER, to, subject, text });
    }
  } catch (err) {
    status = 'failed';
    error = String(err.message || err).slice(0, 300);
    console.error('email failed:', error);
  }

  try {
    await EmailLog.create({
      to, subject, body: String(text || '').slice(0, 4000), kind,
      userId, sentBy, sentByRole, planId, status, error,
    });
  } catch (err) {
    console.error('email log failed:', err.message);
  }
  return status;
}
