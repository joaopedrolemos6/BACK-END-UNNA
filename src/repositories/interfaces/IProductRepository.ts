import {
  Product,
  ProductVariant,
  ProductImage,
} from "../../entities/Product";

export interface IProductRepository {
  createProduct(data: Omit<Product, "id" | "createdAt" | "updatedAt">): Promise<Product>;
  updateProduct(id: number, data: Partial<Product>): Promise<void>;

  createVariants(productId: number, variants: Omit<ProductVariant, "id" | "productId" | "createdAt" | "updatedAt">[]): Promise<void>;
  createImages(productId: number, images: Omit<ProductImage, "id" | "productId" | "createdAt">[]): Promise<void>;

  findById(id: number): Promise<Product | null>;
  findBySlug(slug: string): Promise<Product | null>;

  findAll(params: {
    categoryId?: number;
    search?: string;
    featured?: boolean;
  }): Promise<Product[]>;

  findVariants(productId: number): Promise<ProductVariant[]>;
  findImages(productId: number): Promise<ProductImage[]>;
}
