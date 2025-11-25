import { apiRateLimiter } from '../config/security';

// apenas exporta o rate limiter base pra ser usado em app.ts ou rotas específicas
export const rateLimiter = apiRateLimiter;
