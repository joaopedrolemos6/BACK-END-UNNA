import { Request, Response } from "express";
import { MercadoPagoService } from "../services/MercadoPagoService";

class MercadoPagoController {
  private service = new MercadoPagoService();

  webhook = async (req: Request, res: Response) => {
    try {
      const topic = req.body.type || req.body.action || "unknown";
      const data = req.body.data || {};
      
      await this.service.processWebhook({
        signature: req.headers["x-signature-id"] as string | undefined,
        topic,
        data,
        body: req.body
      });

      return res.status(200).json({ success: true });
    } catch (error: any) {
      console.error("Erro no webhook:", error.message);
      return res.status(500).json({ error: error.message });
    }
  };
}

export const mercadoPagoController = new MercadoPagoController();
