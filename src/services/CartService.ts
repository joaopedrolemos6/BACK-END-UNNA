import { ICartRepository } from "../repositories/interfaces/ICartRepository";
import { IProductRepository } from "../repositories/interfaces/IProductRepository";
import { AppError } from "../errors/AppError";
import { addToCartSchema, updateCartItemSchema } from "../schemas/cartSchemas";

export class CartService {
  constructor(
    private cartRepository: ICartRepository,
    private productRepository: IProductRepository
  ) {}

  async getOrCreateCart(userId: number) {
    let cart = await this.cartRepository.findActiveCartByUserId(userId);
    if (!cart) {
      cart = await this.cartRepository.createCart(userId);
    }
    return cart;
  }

  async getItems(userId: number) {
    const cart = await this.getOrCreateCart(userId);
    const items = await this.cartRepository.findItems(cart.id);

    return { cart, items };
  }

  async addItem(userId: number, data: any) {
    const parsed = addToCartSchema.safeParse(data);
    if (!parsed.success) {
      throw new AppError("Invalid cart data", 400, parsed.error.format());
    }

    const { productId, productVariantId, quantity } = parsed.data;

    const product = await this.productRepository.findById(productId);
    if (!product) throw new AppError("Product not found", 404);

    let price = product.price;

    if (productVariantId) {
      const variants = await this.productRepository.findVariants(product.id);
      const variant = variants.find((v) => v.id === productVariantId);
      if (!variant) throw new AppError("Variant not found", 404);
      price = variant.price ?? price;
    }

    const cart = await this.getOrCreateCart(userId);

    return await this.cartRepository.addItem(cart.id, {
      productId,
      productVariantId,
      quantity,
      unitPrice: price
    });
  }

  async updateItem(userId: number, itemId: number, data: any) {
    const parsed = updateCartItemSchema.safeParse(data);
    if (!parsed.success) {
      throw new AppError("Invalid cart item update", 400, parsed.error.format());
    }

    const cart = await this.getOrCreateCart(userId);
    const items = await this.cartRepository.findItems(cart.id);

    const target = items.find((i) => i.id === itemId);
    if (!target) throw new AppError("Item not found", 404);

    await this.cartRepository.updateItemQuantity(itemId, parsed.data.quantity);

    return { message: "Item updated" };
  }

  async removeItem(userId: number, itemId: number) {
    const cart = await this.getOrCreateCart(userId);
    const items = await this.cartRepository.findItems(cart.id);

    const target = items.find((i) => i.id === itemId);
    if (!target) throw new AppError("Item not found", 404);

    await this.cartRepository.removeItem(itemId);
    return { message: "Item removed" };
  }
}
