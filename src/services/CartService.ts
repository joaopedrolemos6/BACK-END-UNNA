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

  // ==========================================================
  // 1. ADICIONAR AO CARRINHO (COM VALIDAÇÃO DE ESTOQUE)
  // ==========================================================
  async addItem(userId: number, data: any) {
    const parsed = addToCartSchema.safeParse(data);
    if (!parsed.success) {
      throw new AppError("Dados inválidos", 400, parsed.error.format());
    }

    const { productId, productVariantId, quantity } = parsed.data;

    const product = await this.productRepository.findById(productId);
    if (!product) throw new AppError("Produto não encontrado.", 404);

    let price = product.price;

    // Validação de Variante e Estoque
    if (productVariantId) {
      const variants = await this.productRepository.findVariants(product.id);
      const variant = variants.find((v) => v.id === productVariantId);
      
      if (!variant) throw new AppError("Variante não encontrada.", 404);
      
      // 🔥 VERIFICAÇÃO DE ESTOQUE NO ADD
      if (variant.stock < quantity) {
        throw new AppError(`Estoque insuficiente. Apenas ${variant.stock} itens disponíveis.`, 409);
      }

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

  // ==========================================================
  // 2. ATUALIZAR ITEM (COM VALIDAÇÃO DE ESTOQUE)
  // ==========================================================
  async updateItem(userId: number, itemId: number, data: any) {
    const parsed = updateCartItemSchema.safeParse(data);
    if (!parsed.success) {
      throw new AppError("Dados inválidos", 400, parsed.error.format());
    }

    const { quantity } = parsed.data;

    const cart = await this.getOrCreateCart(userId);
    const items = await this.cartRepository.findItems(cart.id);

    const target = items.find((i) => i.id === itemId);
    if (!target) throw new AppError("Item não encontrado no carrinho.", 404);

    // 🔥 VERIFICAÇÃO DE ESTOQUE NO UPDATE
    // Se o item tiver variante, precisamos checar o estoque dela novamente
    if (target.productVariantId) {
      // Precisamos buscar as variantes do produto original
      const variants = await this.productRepository.findVariants(target.productId);
      const variant = variants.find((v) => v.id === target.productVariantId);

      if (variant) {
        if (variant.stock < quantity) {
          throw new AppError(`Estoque insuficiente. Máximo disponível: ${variant.stock}`, 409);
        }
      }
    }

    await this.cartRepository.updateItemQuantity(itemId, quantity);

    return { message: "Item atualizado com sucesso" };
  }

  async removeItem(userId: number, itemId: number) {
    const cart = await this.getOrCreateCart(userId);
    const items = await this.cartRepository.findItems(cart.id);

    const target = items.find((i) => i.id === itemId);
    if (!target) throw new AppError("Item não encontrado.", 404);

    await this.cartRepository.removeItem(itemId);
    return { message: "Item removido com sucesso" };
  }
}