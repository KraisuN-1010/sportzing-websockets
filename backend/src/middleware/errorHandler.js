import { isApiError } from '../utils/apiError.js';

export const errorHandler = (error, _req, res, _next) => {
  const statusCode = isApiError(error) ? error.statusCode : 500;
  const payload = {
    error: error.message || 'Internal server error',
  };

  if (isApiError(error) && error.details) {
    payload.details = error.details;
  }

  if (process.env.NODE_ENV !== 'production' && !isApiError(error)) {
    payload.stack = error.stack;
  }

  res.status(statusCode).json(payload);
};
