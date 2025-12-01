import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { AppError } from "../errors/AppError";
import { logger } from "../utils/logger";

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  // 1. Erros de Validação (Zod) - Não são falhas do sistema, são erros do usuário
  if (err instanceof ZodError) {
    logger.warn(`⚠️ Validação falhou em ${req.method} ${req.url}: ${JSON.stringify(err.format())}`);
    return res.status(400).json({
      status: "error",
      message: "Validation error",
      errors: err.format(),
    });
  }

  // 2. Erros de Regra de Negócio (AppError) - Esperados
  if (err instanceof AppError) {
    logger.warn(`⚠️ Erro Operacional: ${err.message} (Status: ${err.statusCode})`);
    return res.status(err.statusCode).json({
      status: "error",
      message: err.message,
      details: err.details || null
    });
  }

  // 3. Erros Internos / Inesperados (Bugs, Queda de Banco, etc)
  logger.error(`🔥 CRITICAL ERROR em ${req.method} ${req.url}:`);
  logger.error(err.stack || err.message);

  return res.status(500).json({
    status: "error",
    message: "Internal server error",
  });
}