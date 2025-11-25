import express from 'express';
import cors from 'cors';

import { corsOptions, securityHeaders } from './config/security';
import { rateLimiter } from './middlewares/rateLimiter';
import { router } from './routes';

import { notFoundHandler } from './middlewares/notFoundHandler';
import { errorHandler } from './middlewares/errorHandler';

import { mercadoPagoRoutes } from "./routes/mercadopago.routes";


export const app = express();

// Necessário para ngrok, cloudflare, vercel, proxies etc.
app.set("trust proxy", 1);

// ============================================================
// ⚠️ IMPORTANTE
// NÃO coloque express.raw() globalmente
// O Mercado Pago raw body já está configurado DENTRO das rotas.
// ============================================================

// JSON normal
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Segurança e middlewares globais
app.use(cors(corsOptions));
app.use(securityHeaders);
app.use(rateLimiter);

// ============================================================
// ROTAS DO MERCADO PAGO — precisam vir ANTES do router principal
// pois usam RAW BODY e um fluxo diferente de validação
// ============================================================
app.use("/api/mercadopago", mercadoPagoRoutes);

// ============================================================
// ROTAS NORMAIS DA API
// ============================================================
app.use('/api', router);

// 404
app.use(notFoundHandler);

// Handler de erros (sempre por último)
app.use(errorHandler);
