import { ICategoryRepository } from "../interfaces/ICategoryRepository";
import { Category } from "../../entities/Category";
import { pool } from "../../config/database";

export class CategoryRepository implements ICategoryRepository {
  async create(data: Omit<Category, "id" | "createdAt" | "updatedAt">): Promise<Category> {
    const [result] = await pool.execute(
      `INSERT INTO categories (slug, name, description, is_active, sort_order)
       VALUES (?, ?, ?, ?, ?)`,
      [data.slug, data.name, data.description, data.isActive, data.sortOrder]
    );

    const insertId = (result as any).insertId;
    return await this.findById(insertId) as Category;
  }

  async findAll(): Promise<Category[]> {
    const [rows] = await pool.execute(`SELECT * FROM categories ORDER BY sort_order ASC`);
    return rows as Category[];
  }

  async findBySlug(slug: string): Promise<Category | null> {
    const [rows] = await pool.execute(`SELECT * FROM categories WHERE slug = ?`, [slug]);
    const [cat] = rows as Category[];
    return cat || null;
  }

  async findById(id: number): Promise<Category | null> {
    const [rows] = await pool.execute(`SELECT * FROM categories WHERE id = ?`, [id]);
    const [cat] = rows as Category[];
    return cat || null;
  }
}
