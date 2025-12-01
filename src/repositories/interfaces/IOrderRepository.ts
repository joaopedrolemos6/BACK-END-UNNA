import { Order, OrderItem, OrderShipping, OrderPayment, PaymentStatus, OrderStatus } from "../../entities/Order";

export interface IOrderRepository {
  // Criação
  createOrder(data: Omit<Order, "id" | "createdAt" | "updatedAt">): Promise<Order>;
  createItems(orderId: number, items: Omit<OrderItem, "id">[]): Promise<void>;
  createShipping(data: Omit<OrderShipping, "id">): Promise<void>;
  createPayment(data: Omit<OrderPayment, "id">): Promise<void>;

  // Busca Básica
  findById(id: number): Promise<Order | null>;
  findByOrderNumber(orderNumber: string): Promise<Order | null>;
  
  // Busca Avançada (Novos)
  findManyByUserId(userId: number): Promise<Order[]>;
  findAll(params?: { status?: string }): Promise<Order[]>;
  findFullOrderByNumber(orderNumber: string): Promise<{
    order: Order;
    items: OrderItem[];
    shipping: OrderShipping | null;
    payments: OrderPayment[];
  } | null>;

  // Integração Mercado Pago
  findOrderByPaymentId(paymentId: string): Promise<Order | null>;
  updateMercadoPagoPreference(orderId: number, preferenceId: string): Promise<void>;

  // Atualizações de Status
  updateStatus(orderId: number, status: string): Promise<void>;
  updatePaymentStatus(
    orderId: number,
    params: {
      status: OrderStatus;
      paymentStatus: PaymentStatus;
      mercadoPagoPaymentId?: string | null;
    }
  ): Promise<void>;
}