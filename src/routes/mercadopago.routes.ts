// src/routes/mercadopago.routes.ts

import { Router, raw } from "express"; // Importa 'raw' do express
import { mercadoPagoWebhookController } from "./factories";
import { verifyMercadoPagoSignature } from "../middlewares/verifyMercadoPagoSignature"; 

const mercadoPagoRoutes = Router();

// Middleware raw é aplicado nesta rota para obter o corpo bruto (Buffer)
mercadoPagoRoutes.post(
  "/webhook",
  raw({ type: "application/json", limit: "10mb" }), // <--- OBTÉM O BODY RAW
  verifyMercadoPagoSignature, // Valida a assinatura com o body RAW
  mercadoPagoWebhookController.handle
);

export default mercadoPagoRoutes;