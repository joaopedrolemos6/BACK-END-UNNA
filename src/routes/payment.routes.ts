import { Router } from "express";
import { paymentController } from "./factories";

const router = Router();

router.post("/mercadopago/webhook", paymentController.mercadopagoWebhook);

export { router as paymentRoutes };
