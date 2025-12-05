import { MercadoPagoConfig, Preference, Payment, MerchantOrder } from "mercadopago";
import { env } from "../config/env";
import { Order, OrderItem, PaymentStatus, OrderStatus } from "../entities/Order";
import { IOrderRepository } from "../repositories/interfaces/IOrderRepository";
import { IProductRepository } from "../repositories/interfaces/IProductRepository";
import { AppError } from "../errors/AppError";

export class PaymentService {
  private client: MercadoPagoConfig;
  private preferenceClient: Preference;
  public paymentClient: Payment;
  public merchantOrderClient: MerchantOrder; // <-- Adicionado o cliente MerchantOrder

  constructor(
    private orderRepository: IOrderRepository,
    private productRepository: IProductRepository 
  ) {
    if (!env.MP_ACCESS_TOKEN) {
      throw new Error("MP_ACCESS_TOKEN não configurado.");
    }
    this.client = new MercadoPagoConfig({ accessToken: env.MP_ACCESS_TOKEN });
    this.preferenceClient = new Preference(this.client);
    this.paymentClient = new Payment(this.client);
    this.merchantOrderClient = new MerchantOrder(this.client); // <-- Instanciado
  }

  // ==========================================================
  // 1. CRIAR PREFERÊNCIA DE PAGAMENTO
  // ==========================================================
  async createMercadoPagoPreference(
    order: Order,
    items: OrderItem[],
    customer: { fullName: string; email: string; phone: string }
  ) {
    // 💡 ATENÇÃO: Esta é a URL TEMPORÁRIA do ngrok
    const notificationUrl = "https://a7e32e970e91.ngrok-free.app/api/mercadopago/webhook"; 

    const body = {
      external_reference: order.orderNumber,
      payer: {
        name: customer.fullName,
        email: customer.email,
      },
      items: items.map((item) => ({
        id: String(item.productId),
        title: item.productNameSnapshot,
        quantity: item.quantity,
        currency_id: "BRL",
        unit_price: Number(item.unitPrice)
      })),
      
      // URLs de retorno: o Mercado Pago redireciona o usuário para cá
      back_urls: {
        success: `${env.APP_URL}/checkout/success`,
        failure: `${env.APP_URL}/checkout/failure`,
        pending: `${env.APP_URL}/checkout/pending`
      },
      
      auto_return: "approved" as const,
      notification_url: notificationUrl,
      statement_descriptor: "UNNA E-COMMERCE",
    };

    try {
      const preference = await this.preferenceClient.create({ body });

      if (!preference.id || !preference.init_point) {
        throw new AppError("Falha ao obter ID da preferência do Mercado Pago", 502);
      }

      await this.orderRepository.updateMercadoPagoPreference(order.id, preference.id);

      return {
        preferenceId: preference.id,
        initPoint: preference.init_point,
        sandboxInitPoint: preference.sandbox_init_point
      };
    } catch (error: any) {
      console.error("Erro ao criar preferência no MP:", error);
      const errorMsg = error.cause?.description || error.message;
      throw new AppError(`Erro no pagamento: ${errorMsg}`, 400);
    }
  }

  // ==========================================================
  // 2. BUSCAR MERCHANT ORDER (NOVO MÉTODO)
  // ==========================================================
  async getMerchantOrder(merchantOrderId: string) {
    try {
      const merchantOrder = await this.merchantOrderClient.get({ id: merchantOrderId });
      return merchantOrder;
    } catch (error: any) {
      console.error("Erro ao buscar Merchant Order no MP:", error);
      throw new AppError("Falha ao buscar Merchant Order.", 500);
    }
  }
  
  // ==========================================================
  // 3. PROCESSAR NOTIFICAÇÃO (WEBHOOK)
  // ==========================================================
  async handleMercadoPagoWebhook(paymentId: string) {
    try {
      console.log(`🔄 Consultando pagamento ${paymentId} no Mercado Pago...`);
      
      const payment = await this.paymentClient.get({ id: paymentId });
      
      if (!payment) {
        throw new AppError("Pagamento não encontrado no Mercado Pago", 404);
      }

      const status = payment.status;
      const orderNumber = payment.external_reference;

      if (!orderNumber) {
        console.warn("⚠ Pagamento sem external_reference (Order Number). Ignorando.");
        return;
      }

      console.log(`📄 Pedido associado: ${orderNumber} | Status MP: ${status}`);

      // 1. Buscar PEDIDO COMPLETO (incluindo itens)
      const fullOrder = await this.orderRepository.findFullOrderByNumber(orderNumber);
      
      if (!fullOrder) {
        throw new AppError(`Pedido ${orderNumber} não encontrado no sistema.`, 404);
      }

      const { order, items } = fullOrder;

      let internalStatus: OrderStatus = order.status;
      let paymentStatus: PaymentStatus = order.paymentStatus;

      if (status === 'approved') {
        internalStatus = 'PAID'; 
        paymentStatus = 'PAID';
      } else if (status === 'rejected' || status === 'cancelled') {
        internalStatus = 'CANCELLED';
        paymentStatus = 'FAILED';
      } else if (status === 'refunded' || status === 'charged_back') {
        paymentStatus = 'REFUNDED'; 
      } else if (status === 'in_process' || status === 'pending') {
         internalStatus = 'PENDING';
         paymentStatus = 'PENDING';
      }

      // 2. VERIFICAR SE PRECISA BAIXAR ESTOQUE
      // Só baixamos se o pedido acabou de ser PAGO e antes não estava PAGO
      if (paymentStatus === 'PAID' && order.paymentStatus !== 'PAID') {
          console.log("📉 Pagamento aprovado! Iniciando baixa de estoque...");
          for (const item of items) {
             if (item.productVariantId) {
               await this.productRepository.decreaseStock(item.productVariantId, item.quantity);
               console.log(`   - Item ${item.productNameSnapshot}: -${item.quantity} un.`);
             }
          }
      }

      // 3. Atualizar status no banco
      if (order.paymentStatus !== paymentStatus || order.status !== internalStatus) {
        await this.orderRepository.updatePaymentStatus(order.id, {
          status: internalStatus,
          paymentStatus: paymentStatus,
          mercadoPagoPaymentId: String(paymentId)
        });
        console.log(`✅ Pedido ${orderNumber} atualizado para: ${internalStatus}`);
      } else {
        console.log(`ℹ O status do pedido ${orderNumber} já está atualizado.`);
      }

    } catch (error: any) {
      console.error("Erro ao processar webhook no Service:", error);
      // Aqui podemos lançar um erro 500 para o Mercado Pago tentar reenviar
      throw new AppError(error.message || "Erro interno no webhook", error.statusCode || 500); 
    }
  }
}