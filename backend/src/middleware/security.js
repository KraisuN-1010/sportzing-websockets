import { httpArcjet } from '../config/arcjet.js';

export const arcjetHttpMiddleware = async (req, res, next) => {
  try {
    const decision = await httpArcjet.protect(req);

    if (decision.isDenied()) {
      return res.status(403).json({ error: "Access denied by security policies" });
    }

    // Fail-open: if Arcjet protection errored, log and allow the request
    if (decision.isErrored()) {
      console.error('Arcjet protection error:', decision.error);
    }

    next();
  } catch (error) {
    console.error('Arcjet middleware error:', error);
    next(error);
  }
};

