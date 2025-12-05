import { Request, Response } from "express";
import { PaymentService } from "../services/PaymentService";
import { AppError } from "../errors/AppError";
import { logger } from "../utils/logger";

export class MercadoPagoController {
  constructor(private paymentService: PaymentService) {}

  // ==========================================================
  // 1. WEBHOOK RECEIVER (Processa merchant_order ou payment)
  // ==========================================================
  handleWebhook = async (req: Request, res: Response) => {
    // O Mercado Pago envia id e topic nos query params
    const { id, topic } = req.query;

    if (!id || !topic) {
        // Ignora requisições vazias (evita poluição de logs)
        return res.status(200).send("No ID or Topic received. Ignored.");
    }
    
    logger.info(`📩 Recebido Webhook MP: { id: '${id}', topic: '${topic}' }`);

    try {
        // Se for MERCHANT_ORDER (o que está vindo)
        if (topic === 'merchant_order') {
            const merchantOrder = await this.paymentService.getMerchantOrder(id as string);

            // Um Merchant Order pode ter vários pagamentos.
            // Buscamos o primeiro pagamento aprovado ou em processo.
            const payment = merchantOrder.payments?.find(
                p => p.status === 'approved' || p.status === 'in_process'
            );

            if (payment && payment.id) {
                // Se encontramos um ID de pagamento, processamos o webhook com ele.
                await this.paymentService.handleMercadoPagoWebhook(String(payment.id));
            } else {
                logger.warn(`⚠️ Merchant Order ${id} não tem Payment ID aprovado/pendente.`);
            }

        } else if (topic === 'payment') {
            // Se for PAYMENT ID, processamos diretamente (o caso ideal)
            await this.paymentService.handleMercadoPagoWebhook(id as string);
            logger.info(`✅ Webhook Payment ID ${id} processado.`);
        } else {
             logger.warn(`⚠️ Tópico de webhook desconhecido: ${topic}. Ignorado.`);
        }

    } catch (error: any) {
        logger.error(`❌ Erro CRÍTICO ao processar webhook: ${error.message}`, error);
        // Retorna 500 para o Mercado Pago tentar re-enviar mais tarde (Importante!)
        return res.status(500).send("Internal Server Error"); 
    }

    // Retorna 200 OK para o Mercado Pago parar de tentar re-enviar
    return res.status(200).send("OK");
  };
}