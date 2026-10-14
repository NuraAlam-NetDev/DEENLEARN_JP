import crypto from 'crypto';
export function notFound(req, res, _next) {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, _req, res, _next) {
  let status = err.status || 500;
  let message = err.message || 'Server error';

  if (err.name === 'CastError') {
    status = 400;
    // Name the field, so the real cause shows up in the message and in the server log
    message = err.path && err.path !== '_id' ? `Invalid value for ${err.path}` : 'Invalid id';
    if (process.env.NODE_ENV !== 'production') console.warn('CastError:', err.message);
  } else if (err.name === 'ValidationError') {
    status = 400;
    message = Object.values(err.errors).map((e) => e.message).join(', ');
  } else if (err.code === 11000) {
    status = 409;
    message = 'Duplicate value';
  } else if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      status = 413;
      message = `File is too large (max ${process.env.MAX_FILE_MB || 10} MB)`;
    } else {
      status = 400;
      message =
        err.code === 'LIMIT_UNEXPECTED_FILE'
          ? 'Send exactly one file in the form field "file"'
          : err.message;
    }
  }

  if (status >= 500) console.error(err);
  res.status(status).json({
    message,
    ...(process.env.NODE_ENV !== 'production' && status >= 500 && { stack: err.stack }),
  });
}

// Gives every request an id, so a user can quote it when reporting a problem.
export function requestId(req, res, next) {
  const incoming = String(req.get('x-request-id') || '');
  req.id = /^[\w-]{8,64}$/.test(incoming) ? incoming : crypto.randomUUID();
  res.setHeader('X-Request-Id', req.id);
  next();
}
