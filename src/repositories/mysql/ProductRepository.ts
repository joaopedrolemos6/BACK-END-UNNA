import { IProductRepository } from "../interfaces/IProductRepository";
import { pool } from "../../config/database";
import {
  Product,
  ProductImage,
  ProductVariant
} from "../../entities/Product";

export class ProductRepository implements IProductRepository {
  
  // ==========================================================
  // 1. MÉTODOS DE CRIAÇÃO E ATUALIZAÇÃO
  // ==========================================================
  
  async createProduct(data: Omit<Product, "id" | "createdAt" | "updatedAt">): Promise<Product> {
    const [result] = await pool.execute(
      `INSERT INTO products
       (category_id, slug, name, description, price, old_price, discount_percent, sku, status, is_featured, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        data.categoryId,
        data.slug,
        data.name,
        data.description,
        data.price,
        data.oldPrice,
        data.discountPercent,
        data.sku,
        data.status,
        data.isFeatured
      ]
    );

    const insertId = (result as any).insertId;
    return (await this.findById(insertId)) as Product;
  }

  async updateProduct(id: number, data: Partial<Product>): Promise<void> {
    const fields = Object.keys(data);
    if (fields.length === 0) return;

    const updates = fields.map((f) => `${f} = ?`).join(", ");
    const values = fields.map((f) => (data as any)[f]);

    await pool.execute(
      `UPDATE products SET ${updates}, updated_at = NOW() WHERE id = ?`,
      [...values, id]
    );
  }

  async createVariants(productId: number, variants: Omit<ProductVariant, "id" | "productId" | "createdAt" | "updatedAt">[]): Promise<void> {
    for (const v of variants) {
      await pool.execute(
        `INSERT INTO product_variants (product_id, size_id, color_id, sku, stock, price, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [productId, v.sizeId, v.colorId, v.sku, v.stock, v.price]
      );
    }
  }

  async createImages(productId: number, images: Omit<ProductImage, "id" | "productId" | "createdAt">[]): Promise<void> {
    for (const img of images) {
      await this.addImage(productId, img.imageUrl, img.isMain);
    }
  }

  // ==========================================================
  // 2. MÉTODOS DE BUSCA (AGORA COM IMAGENS)
  // ==========================================================

  async findById(id: number): Promise<Product | null> {
    const [rows]: any = await pool.execute(`SELECT * FROM products WHERE id = ?`, [id]);
    if (rows.length === 0) return null;

    const product = rows[0] as Product;
    
    // Busca e anexa as imagens
    product.images = await this.findImages(product.id);
    
    return product;
  }

  async findBySlug(slug: string): Promise<Product | null> {
    const [rows]: any = await pool.execute(`SELECT * FROM products WHERE slug = ?`, [slug]);
    if (rows.length === 0) return null;

    const product = rows[0] as Product;

    // Busca e anexa as imagens
    product.images = await this.findImages(product.id);

    return product;
  }

  async findAll(params: {
    categoryId?: number;
    search?: string;
    featured?: boolean;
  }): Promise<Product[]> {
    let query = `SELECT * FROM products WHERE 1=1`;
    const values: any[] = [];

    if (params.categoryId) {
      query += ` AND category_id = ?`;
      values.push(params.categoryId);
    }

    if (params.search) {
      query += ` AND name LIKE ?`;
      values.push(`%${params.search}%`);
    }

    if (params.featured) {
      query += ` AND is_featured = 1`;
    }

    query += ` ORDER BY created_at DESC`;

    const [rows]: any = await pool.execute(query, values);
    const products = rows as Product[];

    // Para cada produto, busca as imagens (Populate)
    // Usando Promise.all para fazer as buscas em paralelo (mais rápido)
    const productsWithImages = await Promise.all(
      products.map(async (product) => {
        const images = await this.findImages(product.id);
        return { ...product, images };
      })
    );

    return productsWithImages;
  }

  // ==========================================================
  // 3. MÉTODOS AUXILIARES (IMAGENS E VARIANTES)
  // ==========================================================

  async findVariants(productId: number): Promise<ProductVariant[]> {
    const [rows] = await pool.execute(
      `SELECT * FROM product_variants WHERE product_id = ?`,
      [productId]
    );
    return rows as ProductVariant[];
  }

  async findImages(productId: number): Promise<ProductImage[]> {
    const [rows] = await pool.execute(
      `SELECT * FROM product_images WHERE product_id = ? ORDER BY is_main DESC, sort_order ASC`,
      [productId]
    );
    return rows as ProductImage[];
  }

  // ==========================================================
  // 4. CONTROLE DE ESTOQUE
  // ==========================================================
  async decreaseStock(variantId: number, quantity: number): Promise<void> {
    await pool.execute(
      `UPDATE product_variants 
       SET stock = stock - ? 
       WHERE id = ?`,
      [quantity, variantId]
    );
  }

  // ==========================================================
  // 5. UPLOAD DE IMAGEM ÚNICA
  // ==========================================================
  async addImage(productId: number, imageUrl: string, isMain: boolean = false) {
    // Se for definida como principal, remove o status de principal das outras
    if (isMain) {
      await pool.execute(
        `UPDATE product_images SET is_main = 0 WHERE product_id = ?`,
        [productId]
      );
    }

    const [res]: any = await pool.execute(
      `INSERT INTO product_images (product_id, image_url, is_main, created_at)
       VALUES (?, ?, ?, NOW())`,
      [productId, imageUrl, isMain ? 1 : 0]
    );

    return {
      id: res.insertId,
      productId,
      imageUrl,
      isMain
    };
  }
}