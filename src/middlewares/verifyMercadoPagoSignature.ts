// src/middlewares/verifyMercadoPagoSignature.ts

import { Request, Response, NextFunction } from "express";
import crypto from "crypto";
import env from "../config/env";
import { AppError } from "../errors/AppError";

export function verifyMercadoPagoSignature(req: Request, res: Response, next: NextFunction) {
  const signatureHeader = req.headers["x-signature"] as string;
  const timestampHeader = req.headers["x-request-timestamp"] as string;

  if (!signatureHeader || !timestampHeader) {
    throw new AppError("Missing signature or timestamp header for webhook validation.", 401);
  }

  // O body é um Buffer devido ao middleware express.raw()
  const rawBody = req.body; 

  // String a ser assinada conforme a documentação do Mercado Pago: "id:ID_DO_EVENTO;topic:TIPO_DO_EVENTO;x-request-timestamp:TIMESTAMP"
  // Para webhooks V2, a assinatura é calculada sobre: t={timestamp},{id} e comparada ao header 'x-signature'
  
  // No caso de webhook, o MP sugere usar a string do timestamp concatenada com o body
  const data = `${timestampHeader}.${rawBody.toString("utf8")}`;

  const calculatedSignature = crypto
    .createHmac("sha256", env.MP_WEBHOOK_SECRET)
    .update(data)
    .digest("hex");

  // O formato do header é 'v1=SIGNATURE' (onde SIGNATURE é o calculatedSignature)
  if (!signatureHeader.includes(`v1=${calculatedSignature}`)) {
    throw new AppError("Invalid Mercado Pago signature.", 403);
  }

  // Se for válido, faz o parse do Buffer para JSON para o controller usar
  try {
    req.body = JSON.parse(rawBody.toString("utf8"));
  } catch (e) {
    // Isso deve ser impossível se o raw body for um JSON válido
    throw new AppError("Invalid JSON body in webhook payload after signature validation.", 400);
  }

  next();
}