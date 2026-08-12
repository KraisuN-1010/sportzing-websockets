import dotenv from 'dotenv';
dotenv.config();

// ── Startup validation ───────────────────────────────────────────────────────
// Fail immediately if any required variable is missing or still a placeholder.
// This prevents the server from starting in a broken state.

if (
  !process.env.DATABASE_URL ||
  process.env.DATABASE_URL.includes('[user]') ||
  process.env.DATABASE_URL.includes('[password]') ||
  process.env.DATABASE_URL.includes('[neon_hostname]') ||
  process.env.DATABASE_URL.includes('[dbname]')
) {
  throw new Error('Set a real DATABASE_URL in .env before running the application.');
}

if (!process.env.ARCJET_KEY) {
  throw new Error('ARCJET_KEY environment variable is not set.');
}

if (!process.env.API_SECRET_KEY) {
  throw new Error(
    'API_SECRET_KEY environment variable is not set. ' +
    'Generate a strong random value and add it to .env.'
  );
}

export const env = {
  // Server
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: process.env.PORT || 3000,
  HOST: process.env.HOST || '0.0.0.0',

  // Database
  DATABASE_URL: process.env.DATABASE_URL,
  DB_MAX_CONNECTIONS: process.env.DB_MAX_CONNECTIONS || 5,
  DB_IDLE_TIMEOUT_MS: process.env.DB_IDLE_TIMEOUT_MS || 10000,
  DB_CONNECTION_TIMEOUT_MS: process.env.DB_CONNECTION_TIMEOUT_MS || 5000,

  // Arcjet
  ARCJET_KEY: process.env.ARCJET_KEY,
  ARCJET_ENV: process.env.ARCJET_ENV || 'development',
  ARCJET_MODE: process.env.ARCJET_MODE || 'DRY_RUN',

  // Auth
  API_SECRET_KEY: process.env.API_SECRET_KEY,

  // CORS — comma-separated list of allowed origins
  CORS_ALLOWED_ORIGINS: process.env.CORS_ALLOWED_ORIGINS || 'http://localhost:3000',
};
