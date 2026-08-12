import { env } from '../config/env.js';
import { ApiError } from '../utils/apiError.js';

/**
 * Bearer-token auth middleware for write routes.
 *
 * Clients must include the header:
 *   Authorization: Bearer <API_SECRET_KEY>
 *
 * This is a simple shared-secret gate suitable for an internal API
 * or early-stage project without a user database. Replace with JWT
 * or OAuth if per-user identity is required.
 */
export const authMiddleware = (req, _res, next) => {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new ApiError(401, 'Missing or malformed Authorization header. Expected: Bearer <token>'));
  }

  const token = authHeader.slice(7); // strip "Bearer "

  if (token !== env.API_SECRET_KEY) {
    return next(new ApiError(403, 'Invalid API key'));
  }

  next();
};
