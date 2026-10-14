// validate(schema)           -> checks req.body
// validate(schema, 'query')  -> checks req.query
export const validate =
  (schema, source = 'body') =>
  (req, res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: result.error.issues.map((i) => ({
          field: i.path.join('.'),
          message: i.message,
        })),
      });
    }
    req[source] = result.data; // trimmed / lowercased / defaulted / coerced
    next();
  };
