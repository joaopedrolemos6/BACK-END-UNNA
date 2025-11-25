import { ICartRepository } from "../interfaces/ICartRepository";
import { Cart, CartItem } from "../../entities/Cart";
import { pool } from "../../config/database";

export class CartRepository implements ICartRepository {
  async findActiveCartByUserId(userId: number): Promise<Cart | null> {
    const [rows] = await pool.execute(
      `SELECT * FROM carts WHERE user_id = ? AND status = 'ACTIVE' LIMIT 1`,
      [userId]
    );
    const [cart] = rows as Cart[];
    return cart || null;
  }

  async createCart(userId: number): Promise<Cart> {
    const [result] = await pool.execute(
      `INSERT INTO carts (user_id) VALUES (?)`,
      [userId]
    );
    const id = (result as any).insertId;
    const [rows] = await pool.execute(`SELECT * FROM carts WHERE id = ?`, [id]);
    return (rows as Cart[])[0];
  }

  async addItem(cartId: number, data: Omit<CartItem, "id" | "createdAt" | "updatedAt" | "cartId">): Promise<CartItem> {
    const [result] = await pool.execute(
      `INSERT INTO cart_items (cart_id, product_id, product_variant_id, quantity, unit_price)
       VALUES (?, ?, ?, ?, ?)`,
      [cartId, data.productId, data.productVariantId, data.quantity, data.unitPrice]
    );
    const id = (result as any).insertId;
    const [rows] = await pool.execute(`SELECT * FROM cart_items WHERE id = ?`, [id]);
    return (rows as CartItem[])[0];
  }

  async updateItemQuantity(itemId: number, quantity: number): Promise<void> {
    await pool.execute(
      `UPDATE cart_items SET quantity = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [quantity, itemId]
    );
  }

  async removeItem(itemId: number): Promise<void> {
    await pool.execute(`DELETE FROM cart_items WHERE id = ?`, [itemId]);
  }

  async findItems(cartId: number): Promise<CartItem[]> {
    const [rows] = await pool.execute(
      `SELECT * FROM cart_items WHERE cart_id = ?`,
      [cartId]
    );
    return rows as CartItem[];
  }
}
