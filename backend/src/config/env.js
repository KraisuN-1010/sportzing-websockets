import dotenv from 'dotenv';
dotenv.config();

if (!process.env.DATABASE_URL || process.env.DATABASE_URL.includes('[user]') || process.env.DATABASE_URL.includes('[password]') || process.env.DATABASE_URL.includes('[neon_hostname]') || process.env.DATABASE_URL.includes('[dbname]')) {
  throw new Error('Set a real DATABASE_URL in .env before running the application.');
}

export const env = {
  DATABASE_URL: process.env.DATABASE_URL,
  PORT: process.env.PORT || 3000,
  DB_MAX_CONNECTIONS: process.env.DB_MAX_CONNECTIONS || 5,
  DB_IDLE_TIMEOUT_MS: process.env.DB_IDLE_TIMEOUT_MS || 10000,
  DB_CONNECTION_TIMEOUT_MS: process.env.DB_CONNECTION_TIMEOUT_MS || 5000,
};
