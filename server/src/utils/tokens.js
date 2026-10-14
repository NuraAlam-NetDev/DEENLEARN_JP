import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export const ACCESS_COOKIE = 'access_token';
export const REFRESH_COOKIE = 'refresh_token';

const ACCESS_PATH = '/';
const REFRESH_PATH = '/api/auth'; // refresh cookie is only sent to auth routes

export function signAccessToken(userId) {
  return jwt.sign({ sub: String(userId) }, env.accessSecret, {
    algorithm: 'HS256',
    expiresIn: env.accessTtlSeconds,
  });
}

export function signRefreshToken(userId, jti) {
  return jwt.sign({ sub: String(userId), jti }, env.refreshSecret, {
    algorithm: 'HS256',
    expiresIn: env.refreshTtlSeconds,
  });
}

export const verifyAccessToken = (token) =>
  jwt.verify(token, env.accessSecret, { algorithms: ['HS256'] });

export const verifyRefreshToken = (token) =>
  jwt.verify(token, env.refreshSecret, { algorithms: ['HS256'] });

const base = {
  httpOnly: true,
  secure: env.cookieSecure,
  sameSite: env.cookieSameSite,
};

export function setAuthCookies(res, accessToken, refreshToken) {
  res.cookie(ACCESS_COOKIE, accessToken, {
    ...base,
    path: ACCESS_PATH,
    maxAge: env.accessTtlSeconds * 1000,
  });
  res.cookie(REFRESH_COOKIE, refreshToken, {
    ...base,
    path: REFRESH_PATH,
    maxAge: env.refreshTtlSeconds * 1000,
  });
}

export function clearAuthCookies(res) {
  res.clearCookie(ACCESS_COOKIE, { ...base, path: ACCESS_PATH });
  res.clearCookie(REFRESH_COOKIE, { ...base, path: REFRESH_PATH });
}
