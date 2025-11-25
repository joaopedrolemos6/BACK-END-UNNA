import crypto from "crypto";
import { Request, Response, NextFunction } from "express";

export function verifyMercadoPagoSignature(secret: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const signature = req.headers["x-signature-id"];

    // 1. Simulador do Mercado Pago NÃO envia assinatura
    if (!signature) {
      console.warn("⚠ Webhook SEM assinatura — permitido (simulador do Mercado Pago).");
      return next();
    }

    // 2. Body RAW obrigatório (Express.raw)
    const bodyString = req.body instanceof Buffer
      ? req.body.toString("utf8")
      : JSON.stringify(req.body);

    const computed = crypto
      .createHmac("sha256", secret)
      .update(bodyString)
      .digest("hex");

    if (signature !== computed) {
      return res.status(401).json({ error: "Assinatura inválida" });
    }

    next();
  };
}
