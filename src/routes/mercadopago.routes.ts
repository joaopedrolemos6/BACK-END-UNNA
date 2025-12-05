import { Router } from "express";
import express from "express";
import { mercadoPagoWebhook } from "../controllers/mercadoPagoWebhookController"; // Ajuste o import conforme seu export

const router = Router();

router.get("/", (req, res) => {
  res.send("Rotas do Mercado Pago ativas.");
});

// O Mercado Pago manda um POST para notificar
router.post(
  "/webhook",
  // Se precisar validar assinatura HMAC no futuro, use express.raw aqui. 
  // Por enquanto, express.json no app.ts global já resolve para JSON simples.
  async (req, res) => {
    console.log("📩 Recebendo Webhook MP:", JSON.stringify(req.body));
    console.log("Query Params:", req.query);
    
    // O controller foi importado ali em cima
    return await mercadoPagoWebhook(req, res);
  }
);

export const mercadoPagoRoutes = router;