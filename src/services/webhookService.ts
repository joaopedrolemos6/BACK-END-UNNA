import { OrdersRepository } from "../repositories/ordersRepository";
import { MercadoPagoService } from "./mercadoPagoService";

export class WebhookService {
  private ordersRepository = new OrdersRepository();
  private mp = new MercadoPagoService();

  async processPaymentWebhook(paymentId: string) {
    // 1. consultar status real
    const payment = await this.mp.getPaymentStatus(paymentId);

    // 2. localizar pedido vinculado
    const order = await this.ordersRepository.findOrderByPaymentId(paymentId);

    if (!order) {
      throw new Error("Order not found for this payment");
    }

    let newStatus = "pending";

    if (payment.status === "approved") {
      newStatus = "paid";
    } else if (payment.status === "rejected") {
      newStatus = "failed";
    }

    // 3. atualizar pedido
    await this.ordersRepository.updateStatus(order.id, newStatus);

    return { orderId: order.id, status: newStatus };
  }
}
