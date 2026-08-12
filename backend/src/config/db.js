import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { env } from './env.js';

const pool = new Pool({
  connectionString: env.DATABASE_URL,
  max: Number(env.DB_MAX_CONNECTIONS) || 5,
  idleTimeoutMillis: Number(env.DB_IDLE_TIMEOUT_MS) || 10000,
  connectionTimeoutMillis: Number(env.DB_CONNECTION_TIMEOUT_MS) || 5000,
  allowExitOnIdle: true,
});

export const db = drizzle(pool);
export { pool };
