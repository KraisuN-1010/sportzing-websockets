import { httpArcjet } from '../config/arcjet.js';

export const arcjetHttpMiddleware = async (req, res, next) => {
  try {
    const decision = await httpArcjet.protect(req);

    if (decision.isDenied()) {
      return res.status(403).json({ error: "Access denied by security policies" });
    }

    next();
  } catch (error) {
    next(error);
  }
};

