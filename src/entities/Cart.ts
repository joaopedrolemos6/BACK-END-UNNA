export type CartStatus = 'ACTIVE' | 'CONVERTED' | 'ABANDONED';

export interface Cart {
  id: number;
  userId: number;
  status: CartStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface CartItem {
  id: number;
  cartId: number;
  productId: number;
  productVariantId?: number | null;
  quantity: number;
  unitPrice: number;
  createdAt: Date;
  updatedAt: Date;
}
