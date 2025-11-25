import { MercadoPagoConfig, Preference, Payment } from "mercadopago";
import { env } from "../config/env";
import { Order, OrderItem, PaymentStatus, OrderStatus } from "../entities/Order";
import { IOrderRepository } from "../repositories/interfaces/IOrderRepository";
import { AppError } from "../errors/AppError";

export class PaymentService {
  private client: MercadoPagoConfig;
  private preferenceClient: Preference;
  private paymentClient: Payment;

  constructor(private orderRepository: IOrderRepository) {
    this.client = new MercadoPagoConfig({ accessToken: env.MP_ACCESS_TOKEN });
    this.preferenceClient = new Preference(this.client);
    this.paymentClient = new Payment(this.client);
  }

  async createMercadoPagoPreference(
    order: Order,
    items: OrderItem[],
    customer: {
      fullName: string;
      email: string;
      phone: string;
    }
  ) {
    const notificationUrl = `${env.APP_URL}/api/payments/mercadopago/webhook?secret=${env.MP_WEBHOOK_SECRET}`;

    const body: any = {
      external_reference: order.orderNumber,
      payer: {
        name: customer.fullName,
        email: customer.email
      },
      items: items.map((item) => ({
        id: String(item.productId),
        title: item.productNameSnapshot,
        quantity: item.quantity,
        currency_id: "BRL",
        unit_price: item.unitPrice
      })),
      back_urls: {
        success: `${env.APP_URL}/payment/success`,
        failure: `${env.APP_URL}/payment/failure`,
        pending: `${env.APP_URL}/payment/pending`
      },
      auto_return: "approved",
      notification_url: notificationUrl
    };

    const preference = await this.preferenceClient.create({ body });

    const preferenceId = preference.id as string | undefined;
    const initPoint = preference.init_point as string | undefined;

    if (!preferenceId || !initPoint) {
      throw new AppError("Failed to create Mercado Pago preference", 500);
    }

    // salvar preference_id no pedido
    await this.orderRepository.updateMercadoPagoPreference(order.id, preferenceId);

    return {
      preferenceId,
      initPoint
    };
  }

  async handleMercadoPagoWebhook(payload: any) {
    const { type, data } = payload;

    if (!type || !data?.id) {
      throw new AppError("Invalid Mercado Pago webhook payload", 400);
    }

    if (type !== "payment") {
      // ignorar outros tipos (merchant_order, etc) por enquanto
      return;
    }

    const paymentId = data.id;

    // Buscar o pagamento no MP
    const payment = await this.paymentClient.get({ id: paymentId });

    const status = (payment as any).status as string;
    const externalReference = (payment as any).external_reference as string | undefined;

    if (!externalReference) {
      throw new AppError("Payment without external_reference", 400);
    }

    const order = await this.orderRepository.findByOrderNumber(externalReference);
    if (!order) {
      throw new AppError("Order not found for this payment", 404);
    }

    let orderStatus: OrderStatus = "PENDING";
    let paymentStatus: PaymentStatus = "PENDING";

    if (status === "approved") {
      orderStatus = "PAID";
      paymentStatus = "PAID";
    } else if (status === "rejected" || status === "cancelled") {
      orderStatus = "CANCELLED";
      paymentStatus = "FAILED";
    } else if (status === "in_process" || status === "pending") {
      orderStatus = "PENDING";
      paymentStatus = "PENDING";
    }

    await this.orderRepository.updatePaymentStatus(order.id, {
      status: orderStatus,
      paymentStatus,
      mercadoPagoPaymentId: String(paymentId)
    });
  }
}
