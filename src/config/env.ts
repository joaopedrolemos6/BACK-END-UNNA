import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(3333),

  // Banco de Dados
  DATABASE_HOST: z.string(),
  DATABASE_PORT: z.coerce.number().default(3306),
  DATABASE_USER: z.string(),
  DATABASE_PASSWORD: z.string(),
  DATABASE_NAME: z.string(),

  // Autenticação
  JWT_ACCESS_SECRET: z.string(),
  JWT_REFRESH_SECRET: z.string().optional(), // Opcional para não quebrar se não tiver ainda
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),

  // Configurações Gerais
  CORS_ORIGIN: z.string().default('*'),
  APP_URL: z.string().default('http://localhost:5173'), // URL do Front-end para redirecionamento
  API_URL: z.string().default('http://localhost:3333'), // URL do Back-end para notificação

  // Mercado Pago
  MP_ACCESS_TOKEN: z.string(),
  MP_WEBHOOK_SECRET: z.string(),
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error('❌ Invalid environment variables', _env.error.format());
  throw new Error('Invalid environment variables');
}

export const env = _env.data;