// src/services/webhookService.ts

import env from "../config/env";
import axios from "axios";
import { AppError } from "../errors/AppError";

// Importa as interfaces corretas (resolvendo o erro de path)
import { IOrderRepository } from "../repositories/interfaces/IOrderRepository"; 
import { IProductRepository } from "../repositories/interfaces/IProductRepository";
import { Order, OrderItem } from "../entities/Order"; 

// Tipos básicos do payload de notificação do Mercado Pago
interface WebhookPayload {
  topic: string;
  data: {
    id: string; // payment ID ou merchant order ID
  };
}

export class WebhookService {
    constructor(
        private orderRepository: IOrderRepository, 
        private productRepository: IProductRepository 
    ) {}

    /**
     * Processa a notificação de webhook do Mercado Pago.
     * Deve ser chamada pelo MercadoPagoWebhookController
     * @param payload - O corpo da requisição do webhook.
     * @param rawBody - O corpo da requisição RAW (Buffer), necessário para a validação HMAC.
     */
    async processWebhook(payload: WebhookPayload, rawBody: Buffer): Promise<void> {
        // 1. Ignorar tópicos não relevantes (foco em "payment")
        if (payload.topic !== "payment") {
            console.log(`Webhook ignored: Topic is ${payload.topic}.`);
            return;
        }

        const paymentId = payload.data.id; 
        
        // 2. Busca o status real do pagamento na API do MP (melhor prática de segurança)
        let mpStatus: string;
        try {
            mpStatus = await this.getPaymentStatus(paymentId);
        } catch (error) {
            // Se falhar a comunicação com o MP, loga e lança erro para o MP tentar novamente o webhook.
            console.error(`Error fetching payment status for ID ${paymentId}:`, error);
            throw new AppError("Failed to fetch payment status from external provider.", 500);
        }
        
        // 3. Idempotência: Checar se o pedido já foi processado (P1)
        // Busca um pedido que já tem o ID de pagamento associado.
        const existingOrder = await this.orderRepository.findOrderByPaymentId(paymentId);
        
        if (existingOrder && existingOrder.payment_status === "PAID") {
            console.warn(`Webhook ignored: Payment ID ${paymentId} already processed for order ${existingOrder.order_number}`);
            return; 
        }

        // 4. Lógica de atualização de status e estoque
        if (mpStatus === 'approved') {
            const orderId = existingOrder?.id;
            
            if (orderId) {
                // Se for a primeira vez que recebemos o status 'approved', atualiza.
                if (existingOrder.payment_status !== 'PAID') {
                    await this.orderRepository.updatePaymentStatus(orderId, 'PAID', paymentId);
                    
                    // Nota sobre Estoque: A redução de estoque idealmente foi feita na transação de criação.
                    // Se a lógica for "reduzir aqui", chame a função de redução/baixa de estoque.
                    
                    console.log(`Order ${existingOrder.order_number} status updated to PAID.`);
                }
            } else {
                 console.error(`Order not found for payment ID: ${paymentId}. Cannot update status.`);
            }
           
        } else if (mpStatus === 'rejected' || mpStatus === 'cancelled') {
            // Reversão de estoque / Cancelamento de pedido (P3)
            if (existingOrder && existingOrder.status !== 'CANCELLED') {
                // 1. Reverter estoque (P3) - Este método deve ser criado no seu ProductRepository/OrderRepository
                // Exemplo: await this.orderRepository.restoreStock(existingOrder.id);
                
                // 2. Atualizar o status local
                await this.orderRepository.updateStatus(existingOrder.id, 'CANCELLED');
                console.log(`Order ${existingOrder.order_number} was rejected/cancelled. Status updated to CANCELLED.`);
            }
        }
    }

    /**
     * Busca o status real de um pagamento no Mercado Pago.
     * @param paymentId - O ID de pagamento do Mercado Pago.
     * @returns O status do pagamento (e.g., 'approved', 'rejected').
     */
    private async getPaymentStatus(paymentId: string): Promise<string> {
        const url = `https://api.mercadopago.com/v1/payments/${paymentId}`;
        const headers = {
            'Authorization': `Bearer ${env.MP_ACCESS_TOKEN}`, // MP_ACCESS_TOKEN deve estar acessível
            'Content-Type': 'application/json'
        };
        
        const response = await axios.get(url, { headers });
        return response.data.status;
    }
}