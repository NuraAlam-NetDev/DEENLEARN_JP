// Imported after dotenv/config (see server.js), so process.env is populated.
const required = ['JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET'];
for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`${key} is not set. Add it to server/.env (see .env.example).`);
  }
}
if (process.env.JWT_ACCESS_SECRET === process.env.JWT_REFRESH_SECRET) {
  throw new Error('JWT_ACCESS_SECRET and JWT_REFRESH_SECRET must be different.');
}

const isProd = process.env.NODE_ENV === 'production';
const sameSite = (process.env.COOKIE_SAMESITE || 'lax').toLowerCase();

export const env = {
  isProd,
  accessSecret: process.env.JWT_ACCESS_SECRET,
  refreshSecret: process.env.JWT_REFRESH_SECRET,
  accessTtlSeconds: Number(process.env.ACCESS_TOKEN_MINUTES || 15) * 60,
  refreshTtlSeconds: Number(process.env.REFRESH_TOKEN_DAYS || 7) * 24 * 60 * 60,
  cookieSameSite: sameSite,
  // browsers require Secure when SameSite=None
  cookieSecure: isProd || sameSite === 'none',
  // First allowed origin = the website's address (used for the certificate verification link)
  clientUrl: (process.env.CLIENT_ORIGIN || 'http://localhost:5173').split(',')[0].trim().replace(/\/$/, ''),
};
