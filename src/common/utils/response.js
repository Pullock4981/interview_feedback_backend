/**
 * Standard success response envelope, shared across all controllers so
 * every endpoint returns the same shape:
 *   { success, data, meta, error }
 *
 * `meta` is optional and typically used for pagination:
 *   { page, pageSize, total }
 */
function sendSuccess(res, { statusCode = 200, data = null, meta = null } = {}) {
  return res.status(statusCode).json({
    success: true,
    data,
    meta,
    error: null,
  });
}

module.exports = { sendSuccess };
