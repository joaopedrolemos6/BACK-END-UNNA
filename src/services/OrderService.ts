import { IOrderRepository } from "../repositories/interfaces/IOrderRepository";
import { ICartRepository } from "../repositories/interfaces/ICartRepository";
import { IProductRepository } from "../repositories/interfaces/IProductRepository";
import { StoreService } from "./StoreService";
import { AppError } from "../errors/AppError";
import { createOrderSchema } from "../schemas/orderSchemas";
import crypto from "crypto";
import { PaymentService } from "./PaymentService";

export class OrderService {
  constructor(
    private orderRepository: IOrderRepository,
    private cartRepository: ICartRepository,
    private productRepository: IProductRepository,
    private storeService: StoreService,
    private paymentService: PaymentService
  ) {}

  generateOrderNumber() {
    return "UNNA-" + crypto.randomBytes(4).toString("hex").toUpperCase();
  }

  // ==========================================================
  // 1. CRIAÇÃO DO PEDIDO
  // ==========================================================
  async createOrder(userId: number, data: any) {
    const parsed = createOrderSchema.safeParse(data);
    if (!parsed.success) {
      throw new AppError("Invalid order payload", 400, parsed.error.format());
    }

    const { items, shipping, payment, customer } = parsed.data;

    const cart = await this.cartRepository.findActiveCartByUserId(userId);
    if (!cart) throw new AppError("Cart not found", 404);

    // cálculo do subtotal
    let subtotal = 0;
    const orderItemsPayload: any[] = [];

    for (const item of items) {
      const product = await this.productRepository.findById(item.productId);
      if (!product) throw new AppError("Product not found", 404);

      let price = product.price;

      let variant = null;
      if (item.productVariantId) {
        const variants = await this.productRepository.findVariants(product.id);
        variant = variants.find((v) => v.id === item.productVariantId);
        if (!variant) throw new AppError("Variant not found", 404);
        price = variant.price ?? price;
      }

      subtotal += price * item.quantity;

      orderItemsPayload.push({
        orderId: 0,
        productId: product.id,
        productVariantId: item.productVariantId ?? null,
        productNameSnapshot: product.name,
        productSlugSnapshot: product.slug,
        sizeSnapshot: null,
        colorSnapshot: null,
        quantity: item.quantity,
        unitPrice: price,
        totalPrice: price * item.quantity,
      });
    }

    const shippingAmount = shipping.type === "DELIVERY" ? 20 : 0;

    if (shipping.type === "PICKUP" && !shipping.storeId) {
      throw new AppError("Store is required for pickup shipping", 400);
    }

    const total = subtotal + shippingAmount;

    const order = await this.orderRepository.createOrder({
      userId,
      cartId: cart.id,
      orderNumber: this.generateOrderNumber(),
      status: "PENDING",
      paymentStatus: "PENDING",
      shippingType: shipping.type,
      storeId: shipping.storeId ?? null,
      subtotalAmount: subtotal,
      discountAmount: 0,
      shippingAmount: shippingAmount,
      totalAmount: total,
      mercadoPagoPreferenceId: null,
      mercadoPagoPaymentId: null,
    });

    // monta itens com orderId real
    const itemsToSave = orderItemsPayload.map((i) => ({
      ...i,
      orderId: order.id,
    }));

    await this.orderRepository.createItems(order.id, itemsToSave);

    // baixa de estoque variável
    for (const item of items) {
      if (item.productVariantId) {
        await this.productRepository.decreaseStock(
          item.productVariantId,
          item.quantity
        );
      }
    }

    // endereço de entrega
    if (shipping.type === "DELIVERY" && shipping.address) {
      await this.orderRepository.createShipping({
        orderId: order.id,
        recipientName: customer.fullName,
        phone: customer.phone,
        ...shipping.address,
        shippingMethod: "standard",
        estimatedDeliveryDate: null,
      });
    }

    // registrar pagamento
    await this.orderRepository.createPayment({
      orderId: order.id,
      provider: "MERCADO_PAGO",
      method: payment.method,
      status: "PENDING",
      transactionId: null,
      rawPayload: null,
      paidAt: null,
    });

    // criar preference Mercado Pago
    const { preferenceId, initPoint } =
      await this.paymentService.createMercadoPagoPreference(
        order,
        itemsToSave,
        {
          fullName: customer.fullName,
          email: customer.email,
          phone: customer.phone,
        }
      );

    return {
      orderNumber: order.orderNumber,
      total,
      mercadoPago: {
        preferenceId,
        initPoint,
      },
    };
  }

  // ==========================================================
  // 2. DETALHES DO PEDIDO
  // ==========================================================
  async getOrderDetails(orderNumber: string) {
    if (!orderNumber || typeof orderNumber !== "string") {
      throw new AppError("Invalid orderNumber", 400);
    }

    const fullOrder = await this.orderRepository.findFullOrderByNumber(
      orderNumber
    );
    if (!fullOrder) throw new AppError("Pedido não encontrado.", 404);

    const { order, items, shipping, payments } = fullOrder;

    const timeline: any[] = [];

    // Criado
    timeline.push({
      label: "Pedido criado",
      status: order.status,
      date: order.createdAt ?? (order as any).created_at ?? null,
    });

    // Pagamento
    const lastPayment = payments[0];
    if (lastPayment) {
      timeline.push({
        label: "Pagamento atualizado",
        status: lastPayment.status,
        date: lastPayment.paidAt ?? (lastPayment as any).paid_at ?? null,
      });
    }

    // Envio
    if (shipping) {
      timeline.push({
        label: "Envio / Entrega",
        status: order.status,
        date:
          shipping.estimatedDeliveryDate ??
          (shipping as any).estimated_delivery_date ??
          null,
      });
    }

    return {
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        paymentStatus: order.paymentStatus,
        shippingType: order.shippingType,
        subtotalAmount: order.subtotalAmount,
        discountAmount: order.discountAmount,
        shippingAmount: order.shippingAmount,
        totalAmount: order.totalAmount,
        createdAt: order.createdAt ?? (order as any).created_at ?? null,
        updatedAt: order.updatedAt ?? (order as any).updated_at ?? null,
      },

      items: items.map((item) => ({
        id: item.id,
        productId: item.productId,
        productVariantId: item.productVariantId,
        name: item.productNameSnapshot,
        slug: item.productSlugSnapshot,
        size: item.sizeSnapshot,
        color: item.colorSnapshot,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
      lmfit,
      })),

      shipping: shipping
        ? {
            recipientName: shipping.recipientName,
            phone: shipping.phone,
            street: shipping.street,
            number: shipping.number,
            complement: shipping.complement,
            neighborhood: shipping.neighborhood,
            city: shipping.city,
            state: shipping.state,
            zipCode: shipping.zipCode,
            country: shipping.country,
            shippingMethod: shipping.shippingMethod,
            estimatedDeliveryDate:
              shipping.estimatedDeliveryDate ??
              (shipping as any).estimated_delivery_date ??
              null,
          }
        : null,

      payments: payments.map((p) => ({
        id: p.id,
        provider: p.provider,
        method: p.method,
        status: p.status,
        transactionId: p.transactionId,
        paidAt: p.paidAt ?? (p as any).paid_at ?? null,
      })),

      timeline,
    };
  }

  // ==========================================================
  // 3. ADMIN — LISTAR TODOS OS PEDIDOS
  // ==========================================================
  async listAllOrders(status?: string) {
    const params: any = {};

    if (status && typeof status === "string") {
      params.status = status.toUpperCase();
    }

    const orders = await this.orderRepository.findAll(params);

    return orders.map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      status: o.status,
      paymentStatus: o.paymentStatus,
      totalAmount: o.totalAmount,
      createdAt: o.createdAt ?? (o as any).created_at ?? null,
    }));
  }

  // ==========================================================
  // 4. ADMIN — ATUALIZAR STATUS DO PEDIDO
  // ==========================================================
  async updateOrderStatus(orderId: number, newStatus: string) {
    // 🛠️ CORREÇÃO: Lista sincronizada com o ENUM do seu MySQL
    const allowed = [
      "PENDING",
      "CONFIRMED",
      "PAID",
      "CANCELLED", // Atenção: No seu SQL está com dois Ls
      "SHIPPED",
      "DELIVERED",
    ];

    newStatus = newStatus.toUpperCase();

    if (!allowed.includes(newStatus)) {
      // Retorna erro 400 com mensagem clara
      throw new AppError(`Invalid status. Allowed: ${allowed.join(", ")}`, 400);
    }

    const order = await this.orderRepository.findById(orderId);
    if (!order) throw new AppError("Pedido não encontrado.", 404);

    await this.orderRepository.updateStatus(orderId, newStatus);

    return {
      message: "Status atualizado com sucesso.",
      orderId,
      previousStatus: order.status,
      newStatus,
    };
  }
}