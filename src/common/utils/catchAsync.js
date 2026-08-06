/**
 * Wraps an async Express handler so any rejected promise / thrown error
 * is forwarded to next(err) automatically. Without this, a thrown error
 * inside an "async (req, res) => {}" controller would crash the process
 * instead of being caught by the errorHandler middleware.
 *
 * Usage:
 *   router.get('/', catchAsync(async (req, res) => { ... }));
 */
const catchAsync = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = catchAsync;
