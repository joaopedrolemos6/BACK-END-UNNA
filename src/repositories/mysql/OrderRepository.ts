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
        mercado_pago_preference_id, mercado_pago_payment_id, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        data.userId,
        data.cartId,
        data.orderNumber,
        data.status,
        data.paymentStatus,
        data.shippingType,
        data.storeId || null,
        data.subtotalAmount,
        data.discountAmount,
        data.shippingAmount,
        data.totalAmount,
        data.mercadoPagoPreferenceId || null,
        data.mercadoPagoPaymentId || null
      ]
    );

    const id = (result as any).insertId;
    const [rows]: any = await pool.execute(`SELECT * FROM orders WHERE id = ?`, [id]);
    return rows[0] as Order;
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
        item.productVariantId || null,
        item.productNameSnapshot,
        item.productSlugSnapshot,
        item.sizeSnapshot || null,
        item.colorSnapshot || null,
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
        data.complement || null,
        data.neighborhood,
        data.city,
        data.state,
        data.zipCode,
        data.country,
        data.shippingMethod,
        data.estimatedDeliveryDate || null
      ]
    );
  }

  // ==========================================================
  // 4. REGISTRO DE PAGAMENTO (CORRIGIDO: NOME DA TABELA)
  // ==========================================================
  async createPayment(data: Omit<OrderPayment, "id">): Promise<void> {
    await pool.execute(
      `INSERT INTO order_payment  -- <--- CORRIGIDO: Singular
       (order_id, provider, method, status, transaction_id, raw_payload, paid_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        data.orderId,
        data.provider,
        data.method,
        data.status,
        data.transactionId || null,
        data.rawPayload ? JSON.stringify(data.rawPayload) : null,
        data.paidAt || null
      ]
    );
  }

  // ==========================================================
  // 5. BUSCAR PEDIDOS
  // ==========================================================
  async findById(id: number): Promise<Order | null> {
    const [rows]: any = await pool.execute(`SELECT * FROM orders WHERE id = ?`, [id]);
    return (rows[0] as Order) || null;
  }

  async findByOrderNumber(orderNumber: string): Promise<Order | null> {
    const [rows]: any = await pool.execute(
      `SELECT * FROM orders WHERE order_number = ?`,
      [orderNumber]
    );
    return (rows[0] as Order) || null;
  }

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

  async findManyByUserId(userId: number): Promise<Order[]> {
    const [rows] = await pool.execute(
      `SELECT * FROM orders 
       WHERE user_id = ? 
       ORDER BY created_at DESC`,
      [userId]
    );
    return rows as Order[];
  }

  async findOrderByPaymentId(paymentId: string): Promise<Order | null> {
    const [rows]: any = await pool.execute(
      `SELECT * FROM orders WHERE mercado_pago_payment_id = ?`,
      [paymentId]
    );

    return (rows[0] as Order) || null;
  }

  // ==========================================================
  // 6. UPDATES
  // ==========================================================
  async updateStatus(orderId: number, status: string): Promise<void> {
    await pool.execute(
      `UPDATE orders
       SET status = ?, updated_at = NOW()
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
       SET status = ?, payment_status = ?, mercado_pago_payment_id = ?, updated_at = NOW()
       WHERE id = ?`,
      [
        params.status,
        params.paymentStatus,
        params.mercadoPagoPaymentId || null,
        orderId
      ]
    );
  }

  async updateMercadoPagoPreference(orderId: number, preferenceId: string): Promise<void> {
    await pool.execute(
      `UPDATE orders
       SET mercado_pago_preference_id = ?, updated_at = NOW()
       WHERE id = ?`,
      [preferenceId, orderId]
    );
  }

  // ==========================================================
  // 7. BUSCAR PEDIDO COMPLETO (CORRIGIDO: NOME DA TABELA)
  // ==========================================================
  async findFullOrderByNumber(orderNumber: string): Promise<{
    order: Order;
    items: OrderItem[];
    shipping: OrderShipping | null;
    payments: OrderPayment[];
  } | null> {
    const [orderRows]: any = await pool.execute(
      `SELECT * FROM orders WHERE order_number = ?`,
      [orderNumber]
    );

    const order = orderRows[0] as Order;
    if (!order) return null;

    const [itemsRows] = await pool.execute(
      `SELECT * FROM order_items WHERE order_id = ?`,
      [order.id]
    );
    const items = itemsRows as OrderItem[];

    const [shippingRows]: any = await pool.execute(
      `SELECT * FROM order_shipping WHERE order_id = ?`,
      [order.id]
    );
    const shipping = shippingRows[0] as OrderShipping;
    const shippingData = shipping || null;

    const [paymentsRows] = await pool.execute(
      `SELECT * FROM order_payment WHERE order_id = ? ORDER BY paid_at DESC, id DESC`, // <--- CORRIGIDO: Singular
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