import { Router } from "express";
import express from "express";

import { mercadoPagoController } from "../controllers/MercadoPagoController";
import { verifyMercadoPagoSignature } from "../middlewares/verifyMercadoPagoSignature";

const router = Router();

router.post(
  "/webhook",
  express.raw({ type: "application/json" }),                                    // 1. Raw body
  (req, res, next) => verifyMercadoPagoSignature(process.env.MP_WEBHOOK_SECRET!)(req, res, next), // 2. Validação (ignorando simulador)
  (req, res) => mercadoPagoController.webhook(req, res)                          // 3. Controller
);

export { router as mercadoPagoRoutes };
