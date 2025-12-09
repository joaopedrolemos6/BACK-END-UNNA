// src/controllers/mercadoPagoWebhookController.ts

import { Request, Response } from "express";
import { AppError } from "../errors/AppError";
// Importar os tipos de Serviço e Controller necessários para a injeção
import { WebhookService } from "../services/webhookService";
import { PaymentService } from "../services/PaymentService";
import { OrderController } from "./OrderController"; 

// Tipos básicos para o payload do webhook (para evitar erros de tipo)
interface WebhookPayload {
  topic: string;
  data: {
    id: string; // payment ID ou merchant order ID
  };
}

// Exportação Nomeada (Named Export) da classe
export class MercadoPagoWebhookController { 
    constructor(
        private webhookService: WebhookService,
        private paymentService: PaymentService,
        private orderController: OrderController
    ) {}

    /**
     * Lida com a requisição do webhook do Mercado Pago.
     * O middleware 'verifyMercadoPagoSignature' (próximo passo) garante que o body seja autêntico.
     */
    async handle(req: Request, res: Response): Promise<Response> {
        // req.body está em JSON neste ponto, graças ao middleware verifyMercadoPagoSignature.
        const payload = req.body as WebhookPayload; 

        if (!payload || !payload.topic || !payload.data || !payload.data.id) {
             throw new AppError("Payload de webhook inválido: faltando topic ou data.id", 400);
        }

        // O corpo RAW (Buffer) é passado pelo middleware raw() e está disponível em req.body no início do pipeline.
        // Se a assinatura foi validada, podemos confiar que a origem é do Mercado Pago.
        
        try {
            // A lógica principal (idempotência, busca de status, atualização de DB) é do Service.
            await this.webhookService.processWebhook(payload, null); // O Service usa a lógica de buscar status real

            // Retorna 204 No Content. O Mercado Pago espera um 200/204 para saber que a notificação foi recebida.
            return res.status(204).send();

        } catch (error) {
            console.error("Error processing Mercado Pago webhook:", error);
            // Retorna 500 para que o MP tente reenviar o webhook mais tarde.
            return res.status(500).json({ 
                success: false, 
                message: "Internal webhook processing error. Will retry later." 
            });
        }
    }
}