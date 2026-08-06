const { ValidationError } = require('../utils/AppError');

/**
 * Generic Zod validation middleware factory.
 *
 * Each module defines Zod schemas for body/params/query (see e.g.
 * modules/students/student.validation.js) and wires them in with:
 *
 *   router.post('/', validateRequest({ body: createStudentSchema }), controller.create);
 *
 * On failure, throws a ValidationError with per-field messages so the
 * frontend can highlight exactly which fields are wrong (matches the
 * error envelope documented in the API design: { code, message, fields }).
 */
function validateRequest(schemas = {}) {
  return (req, res, next) => {
    try {
      if (schemas.body) {
        req.body = schemas.body.parse(req.body);
      }
      if (schemas.params) {
        req.params = schemas.params.parse(req.params);
      }
      if (schemas.query) {
        req.query = schemas.query.parse(req.query);
      }
      return next();
    } catch (err) {
      if (err.errors) {
        // ZodError shape
        const fields = err.errors.map((e) => e.path.join('.'));
        const message = err.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join('; ');
        return next(new ValidationError(message, fields));
      }
      return next(err);
    }
  };
}

module.exports = validateRequest;
