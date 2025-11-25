import { IProductRepository } from "../interfaces/IProductRepository";
import { pool } from "../../config/database";
import {
  Product,
  ProductImage,
  ProductVariant
} from "../../entities/Product";

export class ProductRepository implements IProductRepository {
  async createProduct(data: Omit<Product, "id" | "createdAt" | "updatedAt">): Promise<Product> {
    const [result] = await pool.execute(
      `INSERT INTO products
       (category_id, slug, name, description, price, old_price, discount_percent, sku, status, is_featured)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
    return await this.findById(insertId) as Product;
  }

  async updateProduct(id: number, data: Partial<Product>): Promise<void> {
    const fields = Object.keys(data);
    if (fields.length === 0) return;

    const updates = fields.map((f) => `${f} = ?`).join(", ");
    const values = fields.map((f) => (data as any)[f]);

    await pool.execute(
      `UPDATE products SET ${updates}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [...values, id]
    );
  }

  async createVariants(productId: number, variants: Omit<ProductVariant, "id" | "productId" | "createdAt" | "updatedAt">[]): Promise<void> {
    for (const v of variants) {
      await pool.execute(
        `INSERT INTO product_variants (product_id, size_id, color_id, sku, stock, price)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [productId, v.sizeId, v.colorId, v.sku, v.stock, v.price]
      );
    }
  }

  async createImages(productId: number, images: Omit<ProductImage, "id" | "productId" | "createdAt">[]): Promise<void> {
    for (const img of images) {
      await pool.execute(
        `INSERT INTO product_images (product_id, image_url, is_main, sort_order)
         VALUES (?, ?, ?, ?)`,
        [productId, img.imageUrl, img.isMain, img.sortOrder]
      );
    }
  }

  async findById(id: number): Promise<Product | null> {
    const [rows] = await pool.execute(`SELECT * FROM products WHERE id = ?`, [id]);
    const [prod] = rows as Product[];
    return prod || null;
  }

  async findBySlug(slug: string): Promise<Product | null> {
    const [rows] = await pool.execute(`SELECT * FROM products WHERE slug = ?`, [slug]);
    const [prod] = rows as Product[];
    return prod || null;
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

    const [rows] = await pool.execute(query, values);
    return rows as Product[];
  }

  async findVariants(productId: number): Promise<ProductVariant[]> {
    const [rows] = await pool.execute(
      `SELECT * FROM product_variants WHERE product_id = ?`,
      [productId]
    );
    return rows as ProductVariant[];
  }

  async findImages(productId: number): Promise<ProductImage[]> {
    const [rows] = await pool.execute(
      `SELECT * FROM product_images WHERE product_id = ? ORDER BY sort_order ASC`,
      [productId]
    );
    return rows as ProductImage[];
  }
}
