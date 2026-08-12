import { isApiError } from '../utils/apiError.js';
import { env } from '../config/env.js';

export const errorHandler = (error, _req, res, _next) => {
  const isProduction = env.NODE_ENV === 'production';
  const statusCode = isApiError(error) ? error.statusCode : 500;

  // Always log unexpected errors server-side so they can be debugged
  if (!isApiError(error)) {
    console.error('[errorHandler] Unhandled error:', error);
  }

  const payload = {
    // In production, hide raw error messages for non-API errors (they can
    // leak DB table names, query fragments, or stack frames).
    error: isApiError(error)
      ? error.message
      : isProduction
        ? 'Internal server error'
        : error.message || 'Internal server error',
  };

  if (isApiError(error) && error.details) {
    payload.details = error.details;
  }

  // Stack traces are only included in development for non-API errors
  if (!isProduction && !isApiError(error)) {
    payload.stack = error.stack;
  }

  res.status(statusCode).json(payload);
};

