import {
  Order,
  OrderItem,
  OrderPayment,
  OrderShipping,
  PaymentStatus,
  OrderStatus
} from "../../entities/Order";

export interface IOrderRepository {
  createOrder(order: Omit<Order, "id" | "createdAt" | "updatedAt">): Promise<Order>;
  createItems(orderId: number, items: Omit<OrderItem, "id">[]): Promise<void>;
  createShipping(data: Omit<OrderShipping, "id">): Promise<void>;
  createPayment(data: Omit<OrderPayment, "id">): Promise<void>;

  findById(id: number): Promise<Order | null>;
  findByOrderNumber(orderNumber: string): Promise<Order | null>;

  updateMercadoPagoPreference(orderId: number, preferenceId: string): Promise<void>;
  updatePaymentStatus(
    orderId: number,
    params: {
      status: OrderStatus;
      paymentStatus: PaymentStatus;
      mercadoPagoPaymentId?: string | null;
    }
  ): Promise<void>;
}
