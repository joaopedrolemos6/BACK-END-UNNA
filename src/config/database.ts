import { createPool } from 'mysql2/promise';
import { env } from './env';

export const pool = createPool({
  host: env.DATABASE_HOST,
  port: env.DATABASE_PORT,
  user: env.DATABASE_USER,
  password: env.DATABASE_PASSWORD,
  database: env.DATABASE_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Helper opcional para checar conexão na subida da app
export async function testDatabaseConnection() {
  const connection = await pool.getConnection();
  await connection.ping();
  connection.release();
}
