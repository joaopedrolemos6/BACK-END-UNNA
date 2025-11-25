import { Cart, CartItem } from "../../entities/Cart";

export interface ICartRepository {
  findActiveCartByUserId(userId: number): Promise<Cart | null>;
  createCart(userId: number): Promise<Cart>;

  addItem(cartId: number, data: Omit<CartItem, "id" | "createdAt" | "updatedAt" | "cartId">): Promise<CartItem>;
  updateItemQuantity(itemId: number, quantity: number): Promise<void>;
  removeItem(itemId: number): Promise<void>;

  findItems(cartId: number): Promise<CartItem[]>;
}
