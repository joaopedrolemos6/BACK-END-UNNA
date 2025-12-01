import { IOrderRepository } from "../interfaces/IOrderRepository";
import { pool } from "../../config/database";
import {
  Order,
  OrderItem,
  OrderPayment,
  OrderShipping,
  PaymentStatus,
  OrderStatus
} from "../../entities/Order";

export class OrderRepository implements IOrderRepository {

  // ==========================================================
  // 1. CRIAÇÃO DO PEDIDO
  // ==========================================================
  async createOrder(data: Omit<Order, "id" | "createdAt" | "updatedAt">): Promise<Order> {
    const [result] = await pool.execute(
      `INSERT INTO orders
       (user_id, cart_id, order_number, status, payment_status, shipping_type, store_id,
        subtotal_amount, discount_amount, shipping_amount, total_amount,
        mercado_pago_preference_id, mercado_pago_payment_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.userId,
        data.cartId,
        data.orderNumber,
        data.status,
        data.paymentStatus,
        data.shippingType,
        data.storeId,
        data.subtotalAmount,
        data.discountAmount,
        data.shippingAmount,
        data.totalAmount,
        data.mercadoPagoPreferenceId,
        data.mercadoPagoPaymentId
      ]
    );

    const id = (result as any).insertId;
    const [rows] = await pool.execute(`SELECT * FROM orders WHERE id = ?`, [id]);
    return (rows as Order[])[0];
  }

  // ==========================================================
  // 2. ITENS DO PEDIDO
  // ==========================================================
  async createItems(orderId: number, items: Omit<OrderItem, "id">[]): Promise<void> {
    if (items.length === 0) return;

    const placeholders = items.map(() => `(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).join(", ");
    const values: any[] = [];

    for (const item of items) {
      values.push(
        orderId,
        item.productId,
        item.productVariantId,
        item.productNameSnapshot,
        item.productSlugSnapshot,
        item.sizeSnapshot,
        item.colorSnapshot,
        item.quantity,
        item.unitPrice,
        item.totalPrice
      );
    }

    await pool.execute(
      `INSERT INTO order_items
       (order_id, product_id, product_variant_id, product_name_snapshot, product_slug_snapshot,
        size_snapshot, color_snapshot, quantity, unit_price, total_price)
       VALUES ${placeholders}`,
      values
    );
  }

  // ==========================================================
  // 3. ENDEREÇO/ENVIO DO PEDIDO
  // ==========================================================
  async createShipping(data: Omit<OrderShipping, "id">): Promise<void> {
    await pool.execute(
      `INSERT INTO order_shipping
       (order_id, recipient_name, phone, street, number, complement,
        neighborhood, city, state, zip_code, country, shipping_method, estimated_delivery_date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.orderId,
        data.recipientName,
        data.phone,
        data.street,
        data.number,
        data.complement,
        data.neighborhood,
        data.city,
        data.state,
        data.zipCode,
        data.country,
        data.shippingMethod,
        data.estimatedDeliveryDate
      ]
    );
  }

  // ==========================================================
  // 4. REGISTRO DE PAGAMENTO
  // ==========================================================
  async createPayment(data: Omit<OrderPayment, "id">): Promise<void> {
    await pool.execute(
      `INSERT INTO order_payment
       (order_id, provider, method, status, transaction_id, raw_payload, paid_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        data.orderId,
        data.provider,
        data.method,
        data.status,
        data.transactionId,
        JSON.stringify(data.rawPayload ?? null),
        data.paidAt
      ]
    );
  }

  // ==========================================================
  // 5. BUSCAR PEDIDOS (MÉTODOS BÁSICOS)
  // ==========================================================
  async findById(id: number): Promise<Order | null> {
    const [rows] = await pool.execute(`SELECT * FROM orders WHERE id = ?`, [id]);
    const [order] = rows as Order[];
    return order || null;
  }

  async findByOrderNumber(orderNumber: string): Promise<Order | null> {
    const [rows] = await pool.execute(
      `SELECT * FROM orders WHERE order_number = ?`,
      [orderNumber]
    );
    const [order] = rows as Order[];
    return order || null;
  }

  // ==========================================================
  // 6. LISTAGENS (ATUALIZADO ETAPA 6)
  // ==========================================================
  async findAll(params?: { status?: string }): Promise<Order[]> {
    let query = `SELECT * FROM orders WHERE 1=1`;
    const values: any[] = [];

    if (params?.status) {
      query += ` AND status = ?`;
      values.push(params.status);
    }

    query += ` ORDER BY created_at DESC`;

    const [rows] = await pool.execute(query, values);
    return rows as Order[];
  }

  // Lista pedidos de um usuário específico (Histórico)
  async findManyByUserId(userId: number): Promise<Order[]> {
    const [rows] = await pool.execute(
      `SELECT * FROM orders 
       WHERE user_id = ? 
       ORDER BY created_at DESC`,
      [userId]
    );
    return rows as Order[];
  }

  // ==========================================================
  // 7. MÉTODOS EXTRAS (MERCADO PAGO & UPDATES)
  // ==========================================================
  async findOrderByPaymentId(paymentId: string): Promise<Order | null> {
    const [rows] = await pool.execute(
      `SELECT * FROM orders WHERE mercado_pago_payment_id = ?`,
      [paymentId]
    );

    const [order] = rows as Order[];
    return order || null;
  }

  async updateStatus(orderId: number, status: string): Promise<void> {
    await pool.execute(
      `UPDATE orders
       SET status = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [status, orderId]
    );
  }

  async updatePaymentStatus(
    orderId: number,
    params: {
      status: OrderStatus;
      paymentStatus: PaymentStatus;
      mercadoPagoPaymentId?: string | null;
    }
  ): Promise<void> {
    await pool.execute(
      `UPDATE orders
       SET status = ?, payment_status = ?, mercado_pago_payment_id = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [
        params.status,
        params.paymentStatus,
        params.mercadoPagoPaymentId ?? null,
        orderId
      ]
    );
  }

  async updateMercadoPagoPreference(orderId: number, preferenceId: string): Promise<void> {
    await pool.execute(
      `UPDATE orders
       SET mercado_pago_preference_id = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [preferenceId, orderId]
    );
  }

  // ==========================================================
  // 8. BUSCAR PEDIDO COMPLETO
  // ==========================================================
  async findFullOrderByNumber(orderNumber: string): Promise<{
    order: Order;
    items: OrderItem[];
    shipping: OrderShipping | null;
    payments: OrderPayment[];
  } | null> {
    const [orderRows] = await pool.execute(
      `SELECT * FROM orders WHERE order_number = ?`,
      [orderNumber]
    );

    const [order] = orderRows as Order[];
    if (!order) return null;

    const [itemsRows] = await pool.execute(
      `SELECT * FROM order_items WHERE order_id = ?`,
      [order.id]
    );
    const items = itemsRows as OrderItem[];

    const [shippingRows] = await pool.execute(
      `SELECT * FROM order_shipping WHERE order_id = ?`,
      [order.id]
    );
    const [shipping] = shippingRows as OrderShipping[];
    const shippingData = shipping || null;

    const [paymentsRows] = await pool.execute(
      `SELECT * FROM order_payment WHERE order_id = ? ORDER BY paid_at DESC, id DESC`,
      [order.id]
    );
    const payments = paymentsRows as OrderPayment[];

    return {
      order,
      items,
      shipping: shippingData,
      payments
    };
  }
}
