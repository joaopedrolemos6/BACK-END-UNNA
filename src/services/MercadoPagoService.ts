import crypto from "crypto";
import axios from "axios";
import { env } from "../config/env";
import { logger } from "../utils/logger";
import { OrderRepository } from "../repositories/mysql/OrderRepository";

interface WebhookData {
  signature: string | undefined;
  topic: string;
  data: any;
  body: any;
}

export class MercadoPagoService {
  private token: string;

  // Aqui usamos a implementação real do repositório:
  private ordersRepository = new OrderRepository();

  constructor() {
    this.token = env.MP_ACCESS_TOKEN;
  }

  // ==========================================================
  // 1. PROCESSAMENTO DO WEBHOOK
  // ==========================================================
  async processWebhook({ signature, topic, data, body }: WebhookData) {
    logger.info("📦 Processando webhook do Mercado Pago...");

    // 1. VALIDAR ASSINATURA
    this.validateSignature(signature, body);

    // 2. TRATAR EVENTO
    switch (topic) {
      case "payment":
        logger.info("💰 Webhook: evento de pagamento recebido");
        logger.info(`🔎 Payment ID: ${data.id}`);

        return await this.processPaymentWebhook(data.id);

      default:
        logger.warn(`⚠ Evento não tratado: ${topic}`);
        return;
    }
  }

  // ==========================================================
  // 2. VALIDAR ASSINATURA DO MERCADO PAGO
  // ==========================================================
  private validateSignature(signature: string | undefined, body: any) {
    if (!signature) {
      throw new Error("Assinatura do webhook ausente.");
    }

    const computed = crypto
      .createHmac("sha256", env.MP_WEBHOOK_SECRET)
      .update(JSON.stringify(body))
      .digest("hex");

    if (signature !== computed) {
      throw new Error("Assinatura inválida: webhook não autorizado.");
    }

    logger.info("🔐 Assinatura válida!");
  }

  // ==========================================================
  // 3. CONSULTAR PAGAMENTO REAL
  // ==========================================================
  async getPaymentStatus(paymentId: string) {
    const url = `https://api.mercadopago.com/v1/payments/${paymentId}`;

    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${this.token}`,
      },
    });

    return response.data;
  }

  // ==========================================================
  // 4. PROCESSAR E ATUALIZAR PEDIDO
  // ==========================================================
  async processPaymentWebhook(paymentId: string) {
    logger.info(`🔄 Sincronizando pagamento ${paymentId} com Mercado Pago...`);

    // 1. Buscar status real
    const payment = await this.getPaymentStatus(paymentId);

    logger.info(`📘 Status real do pagamento: ${payment.status}`);

    // 2. Buscar pedido usando o paymentId
    const order = await this.orderRepository.findOrderByPaymentId(paymentId);

    if (!order) {
      logger.error("❌ Pedido não encontrado para esse pagamento.");
      return;
    }

    logger.info(`🧾 Pedido localizado: ${order.id}`);

    // 3. Definir o novo status interno
    let newStatus = "pending";

    if (payment.status === "approved") {
      newStatus = "paid";
    } else if (payment.status === "rejected") {
      newStatus = "failed";
    }

    // 4. Atualizar o pedido
    await this.orderRepository.updateStatus(order.id, newStatus);

    logger.info(`✅ Pedido ${order.id} atualizado para: ${newStatus}`);

    return {
      orderId: order.id,
      paymentStatus: payment.status,
      internalStatus: newStatus,
    };
  }
}
