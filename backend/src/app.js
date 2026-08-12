import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import matchRoutes from './routes/matchRoutes.js';
import commentaryRoutes from './routes/commentaryRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';
import { notFoundHandler } from './middleware/notFoundHandler.js';
import { arcjetHttpMiddleware } from './middleware/security.js';
import { env } from './config/env.js';

const app = express();

// ── Security headers — must be first ────────────────────────────────────
// Sets X-Content-Type-Options, X-Frame-Options, HSTS, and a dozen others.
app.use(helmet());

// ── CORS ────────────────────────────────────────────────────────────
// Only browser origins listed in CORS_ALLOWED_ORIGINS (comma-separated) are
// permitted to make cross-origin requests. Rejects all others with 403.
const allowedOrigins = env.CORS_ALLOWED_ORIGINS
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow server-to-server / curl requests (origin is undefined)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      callback(new Error(`CORS: origin '${origin}' is not allowed`));
    },
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// ── Body parsing ───────────────────────────────────────────────────────
// Explicit limit guards against large-payload DoS. 50 kb is generous for
// this API's payload shapes (match metadata, commentary text).
app.use(express.json({ limit: '50kb' }));

// ── Arcjet (rate limit, bot detection, shield) ─────────────────────────
app.use(arcjetHttpMiddleware);

// ── Routes ───────────────────────────────────────────────────────────
app.get('/', (_req, res) => {
  res.send('You are live');
});

app.use('/api/matches', matchRoutes);
app.use('/api/matches/:id/commentary', commentaryRoutes);
app.use(notFoundHandler);
app.use(errorHandler);

export default app;