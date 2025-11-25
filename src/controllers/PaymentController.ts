import { Request, Response } from "express";
import { PaymentService } from "../services/PaymentService";
import { env } from "../config/env";
import { AppError } from "../errors/AppError";

export class PaymentController {
  constructor(private paymentService: PaymentService) {}

  mercadopagoWebhook = async (req: Request, res: Response) => {
    const secret = req.query.secret as string | undefined;

    if (!secret || secret !== env.MP_WEBHOOK_SECRET) {
      throw new AppError("Invalid webhook secret", 401);
    }

    await this.paymentService.handleMercadoPagoWebhook(req.body);

    // MP espera 200 OK rápido
    return res.status(200).json({ received: true });
  };
}
