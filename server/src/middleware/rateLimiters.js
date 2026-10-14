import rateLimit from 'express-rate-limit';

const make = (options) =>
  rateLimit({
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    ...options,
  });

// Whole API: generous, stops basic floods
export const apiLimiter = make({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  message: { message: 'Too many requests, please try again later.' },
});

// Login: only failed attempts count, so brute-forcing is throttled
export const loginLimiter = make({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  skipSuccessfulRequests: true,
  message: { message: 'Too many login attempts, please try again in 15 minutes.' },
});

export const registerLimiter = make({
  windowMs: 60 * 60 * 1000,
  limit: 10,
  message: { message: 'Too many sign-ups from this IP, please try again later.' },
});

export const refreshLimiter = make({
  windowMs: 15 * 60 * 1000,
  limit: 60,
  message: { message: 'Too many refresh attempts, please try again later.' },
});

export const uploadLimiter = make({
  windowMs: 60 * 60 * 1000,
  limit: 60,
  message: { message: 'Too many uploads, please try again later.' },
});

// Posting questions and replies: stops flooding a lesson's discussion
export const contentLimiter = make({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  message: { message: 'You are posting too fast, please try again in a few minutes.' },
});
