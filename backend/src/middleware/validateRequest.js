// middleware/validateRequest.js
import { ApiError } from '../utils/apiError.js';

/**
 * Validates req[source] against a Zod schema.
 * On success, writes the parsed (and coerced) data back so downstream
 * handlers receive the correct types — e.g. params.id is a number, not a string.
 * On failure, forwards a 400 ApiError with Zod's issue list.
 */
export const validateRequest = (schema, source = 'body') => (req, _res, next) => {
  const result = schema.safeParse(req[source]);
  if (!result.success) {
    return next(new ApiError(400, 'Validation failed', result.error.issues));
  }

  if (source === 'query') {
    // Express makes req.query read-only in some configurations,
    // so we use a separate property to carry validated query data.
    req.validatedQuery = result.data;
  } else {
    // For body and params, overwrite with the coerced Zod output
    // so controllers see the right types (e.g. numeric IDs, not strings).
    req[source] = result.data;
  }

  next();
};