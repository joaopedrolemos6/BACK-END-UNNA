// src/config/env.ts

import "dotenv/config";
import { z } from "zod";

// Define o schema de validação para as variáveis de ambiente
const envSchema = z.object({
  // Configuração do Servidor
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(3333),
  
  // Variáveis do Banco de Dados
  DB_HOST: z.string().min(1),
  DB_USER: z.string().min(1),
  DB_PASSWORD: z.string().optional(),
  DB_NAME: z.string().min(1),
  DB_PORT: z.coerce.number().default(3306),
  
  // Variáveis de Autenticação
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  
  // >> CORREÇÕES CRÍTICAS MERCADO PAGO E URLS <<
  // APP_URL: URL base pública para webhooks e back_urls (use ngrok em dev)
  APP_URL: z.string().url().min(1).describe("https://610d055a4635.ngrok-free.app"), 
  MP_ACCESS_TOKEN: z.string().min(1).describe("APP_USR-5163449987148164-111712-26d15b6eefecbecf16e0555204f0db52-2995220723"),
  MP_WEBHOOK_SECRET: z.string().min(1).describe("7fcabf37e8b6a0fca5bd050eeb4cde3acce7f1b03d36bce858df20d2825e8973"),
});

// Acessa as variáveis de ambiente e valida
const _env = envSchema.safeParse(process.env);

if (_env.success === false) {
  console.error("❌ Erro de Validação de Variáveis de Ambiente!", _env.error.format());
  throw new Error("Configuração de ambiente inválida. Verifique seu arquivo .env.");
}

// Exporta o objeto de variáveis de ambiente tipado
export default _env.data;