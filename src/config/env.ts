import "dotenv/config";
import { z } from "zod";

// Define o schema de validação para as variáveis de ambiente
const envSchema = z.object({
  // Configuração do Servidor
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(3333),
  
  // URL Pública da Aplicação (Importante para Mercado Pago e Imagens)
  APP_URL: z.string().url().default("http://localhost:3333"),

  // Banco de Dados (MySQL)
  DATABASE_HOST: z.string().default("localhost"),
  DATABASE_PORT: z.coerce.number().default(3306),
  DATABASE_USER: z.string().default("root"),
  DATABASE_PASSWORD: z.string().default("root"),
  DATABASE_NAME: z.string().default("modelo_unna"),

  // Autenticação (JWT)
  JWT_ACCESS_SECRET: z.string().min(1, "JWT Access Secret é obrigatório"),
  JWT_REFRESH_SECRET: z.string().min(1, "JWT Refresh Secret é obrigatório"),
  JWT_ACCESS_EXPIRES_IN: z.string().default("15m"),
  JWT_REFRESH_EXPIRES_IN: z.string().default("7d"),

  // Mercado Pago
  MP_ACCESS_TOKEN: z.string().optional(),
  MP_WEBHOOK_SECRET: z.string().optional(),

  // CORS
  CORS_ORIGIN: z.string().default("http://localhost:5173"),
});

// Faz o parse e valida as variáveis. Se falhar, lança erro no console e para o app.
const _env = envSchema.safeParse(process.env);

if (_env.success === false) {
  console.error("❌ Invalid environment variables:", _env.error.format());
  process.exit(1); // Encerra a aplicação se o .env estiver inválido
}

export const env = _env.data;