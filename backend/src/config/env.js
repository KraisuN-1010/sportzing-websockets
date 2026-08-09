import dotenv from 'dotenv';
dotenv.config();

if (!process.env.DATABASE_URL || process.env.DATABASE_URL.includes('[user]') || process.env.DATABASE_URL.includes('[password]') || process.env.DATABASE_URL.includes('[neon_hostname]') || process.env.DATABASE_URL.includes('[dbname]')) {
  throw new Error('Set a real DATABASE_URL in .env before running the application.');
}

export const env = {
  DATABASE_URL: process.env.DATABASE_URL,
  PORT: process.env.PORT || 3000,
}