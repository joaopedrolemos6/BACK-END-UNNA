import { IProductRepository } from "../repositories/interfaces/IProductRepository";
import { AppError } from "../errors/AppError";
import {
  createProductSchema,
  updateProductSchema
} from "../schemas/productSchemas";

export class ProductService {
  constructor(private productRepository: IProductRepository) {}

  async create(data: any) {
    const parsed = createProductSchema.safeParse(data);
    if (!parsed.success) {
      throw new AppError("Invalid product data", 400, parsed.error.format());
    }

    const {
      categoryId,
      slug,
      name,
      description,
      price,
      oldPrice,
      discountPercent,
      sku,
      status,
      isFeatured,
      variants,
      images
    } = parsed.data;

    const product = await this.productRepository.createProduct({
      categoryId,
      slug,
      name,
      description,
      price,
      oldPrice,
      discountPercent,
      sku,
      status,
      isFeatured
    });

    await this.productRepository.createVariants(product.id, variants);
    await this.productRepository.createImages(product.id, images);

    return product;
  }

  async update(id: number, data: any) {
    const parsed = updateProductSchema.safeParse(data);
    if (!parsed.success) {
      throw new AppError("Invalid product update data", 400, parsed.error.format());
    }

    await this.productRepository.updateProduct(id, parsed.data);
    return { message: "Product updated successfully" };
  }

  async getBySlug(slug: string) {
    const product = await this.productRepository.findBySlug(slug);
    if (!product) throw new AppError("Product not found", 404);

    const variants = await this.productRepository.findVariants(product.id);
    const images = await this.productRepository.findImages(product.id);

    return { ...product, variants, images };
  }

  async list(params: {
    categoryId?: number;
    search?: string;
    featured?: boolean;
  }) {
    return this.productRepository.findAll(params);
  }

  // ==========================================================
  // NOVO MÉTODO: uploadImage()
  // ==========================================================
  async uploadImage(productId: number, filename: string) {
    // Verifica se o produto existe
    const product = await this.productRepository.findById(productId);
    if (!product) {
      throw new AppError("Product not found", 404);
    }

    // URL base (ajuste conforme necessário)
    const baseUrl = "http://localhost:3333/uploads";
    const imageUrl = `${baseUrl}/${filename}`;

    // Salva no banco
    const result = await this.productRepository.addImage(productId, imageUrl, false);

    return result;
  }
}
