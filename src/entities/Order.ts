export type OrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PAID'
  | 'CANCELLED'
  | 'SHIPPED'
  | 'DELIVERED';

export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';

export type ShippingType = 'DELIVERY' | 'PICKUP';

export interface Order {
  id: number;
  userId: number;
  cartId?: number | null;
  orderNumber: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  shippingType: ShippingType;
  storeId?: number | null;
  subtotalAmount: number;
  discountAmount: number;
  shippingAmount: number;
  totalAmount: number;
  mercadoPagoPreferenceId?: string | null;
  mercadoPagoPaymentId?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderItem {
  id: number;
  orderId: number;
  productId: number;
  productVariantId?: number | null;
  productNameSnapshot: string;
  productSlugSnapshot: string;
  sizeSnapshot?: string | null;
  colorSnapshot?: string | null;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface OrderShipping {
  id: number;
  orderId: number;
  recipientName: string;
  phone: string;
  street: string;
  number: string;
  complement?: string | null;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  shippingMethod: string;
  estimatedDeliveryDate?: Date | null;
}

export interface OrderPayment {
  id: number;
  orderId: number;
  provider: string; // ex: MERCADO_PAGO
  method: string;   // ex: credit_card, pix
  status: string;   // status retornado pelo MP
  transactionId?: string | null;
  rawPayload?: unknown;
  paidAt?: Date | null;
  createdAt: Date;
}
