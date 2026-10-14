// Express 4 doesn't catch rejected promises; this forwards them to errorHandler.
export const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);
