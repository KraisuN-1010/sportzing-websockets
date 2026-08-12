// middleware/validateRequest.js
import { ApiError } from '../utils/apiError.js';

export const validateRequest = (schema, source = 'body') => (req, _res, next) => {
  const result = schema.safeParse(req[source]);
  if (!result.success) {
    return next(new ApiError(400, 'Validation failed', result.error.issues));
  }

  if (source === 'query') {
    req.validatedQuery = result.data; 
  } else {
    req[source] = result.data;
  }

  next();
};