import { Router } from "express";
import express from "express";
import { mercadoPagoController } from "../controllers/MercadoPagoController";

const router = Router();

// Rota de teste para confirmar que o arquivo carregou
router.get("/", (req, res) => {
  res.send("Rotas do Mercado Pago carregadas com sucesso.");
});

router.post(
  "/webhook",
  // Usamos express.raw para pegar o corpo cru se necessário, senão o JSON padrão
  express.json(), 
  async (req, res) => {
    console.log("📩 Recebendo notificação no /webhook");
    try {
      // Chamada direta para garantir que o método existe
      if (!mercadoPagoController || !mercadoPagoController.handleWebhook) {
         console.error("❌ Erro Crítico: Controller não inicializado corretamente.");
         return res.status(500).json({ error: "Internal Server Error - Controller Missing" });
      }
      return await mercadoPagoController.handleWebhook(req, res);
    } catch (error) {
      console.error("Erro na rota webhook:", error);
      return res.status(500).json({ error: "Internal Execution Error" });
    }
  }
);

// MUDANÇA IMPORTANTE: Exportação direta da constante
export const mercadoPagoRoutes = router;