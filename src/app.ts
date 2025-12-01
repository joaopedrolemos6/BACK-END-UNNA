import express from "express";
import cors from "cors";
import helmet from "helmet"; // Importante para headers de segurança
import "express-async-errors"; // Garante que erros async sejam capturados pelo middleware
import path from "path"; // <--- ADICIONADO: Necessário para caminhos de pastas

import { router } from "./routes";
import { errorHandler } from "./middlewares/errorHandler";
import { notFoundHandler } from "./middlewares/notFoundHandler";
import { env } from "./config/env";
import { apiRateLimiter, corsOptions, securityHeaders } from "./config/security"; // Importando suas configs

const app = express();

// ==========================================================
// 1. MIDDLEWARES DE SEGURANÇA (Ordem importa!)
// ==========================================================

// Helmet adiciona headers HTTP de segurança (X-Content-Type-Options, X-Frame-Options, etc)
// Usando a configuração do seu arquivo security.ts se for middleware, ou direto do helmet()
// OBS: Para servir imagens, as vezes o Helmet bloqueia carregamento cross-origin (CORP).
// Se as imagens não carregarem no front, precisaremos ajustar a policy do helmet.
app.use(helmet({
  crossOriginResourcePolicy: false, // Permite carregar imagens de outros domínios/locais se necessário
}));

// CORS restringe quem pode chamar sua API
app.use(cors(corsOptions));

// Rate Limiter protege contra força bruta e DDoS simples
// Aplicamos apenas nas rotas /api para não bloquear arquivos estáticos se houver
app.use("/api", apiRateLimiter);

// ==========================================================
// 2. PARSERS DE CORPO DE REQUISIÇÃO
// ==========================================================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ==========================================================
// 3. ARQUIVOS ESTÁTICOS (IMAGENS)
// ==========================================================
// Torna a pasta 'uploads' pública na URL /uploads
// Exemplo: http://localhost:3333/uploads/minha-foto.jpg
app.use("/uploads", express.static(path.resolve(__dirname, "..", "uploads")));

// ==========================================================
// 4. ROTAS
// ==========================================================
// Prefixo /api para versionamento e organização
app.use("/api", router);

// ==========================================================
// 5. TRATAMENTO DE ERROS
// ==========================================================
// Middleware para rotas não encontradas (404)
app.use(notFoundHandler);

// Middleware global de erros (Zod, AppError, etc)
// DEVE ser o último app.use()
app.use(errorHandler);

export { app };