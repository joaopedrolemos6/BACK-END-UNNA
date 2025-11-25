import { Request, Response } from "express";
import { WebhookService } from "../services/webhookService";

const service = new WebhookService();

export async function mercadoPagoWebhook(req: Request, res: Response) {
  try {
    const paymentId = req.body.data?.id;

    if (!paymentId) {
      return res.status(400).json({ error: "Payment ID missing" });
    }

    const result = await service.processPaymentWebhook(paymentId);

    return res.status(200).json({
      message: "Webhook processed successfully",
      data: result
    });
  } catch (error) {
    console.error("Webhook error:", error);
    return res.status(500).json({ error: "Server error" });
  }
}
