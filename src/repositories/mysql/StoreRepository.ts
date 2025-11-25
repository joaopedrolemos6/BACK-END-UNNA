import { IStoreRepository } from "../interfaces/IStoreRepository";
import { Store } from "../../entities/Store";
import { pool } from "../../config/database";

export class StoreRepository implements IStoreRepository {
  async findAll(): Promise<Store[]> {
    const [rows] = await pool.execute(`SELECT * FROM stores WHERE is_active = 1`);
    return rows as Store[];
  }

  async findBySlug(slug: string): Promise<Store | null> {
    const [rows] = await pool.execute(`SELECT * FROM stores WHERE slug = ?`, [slug]);
    const [store] = rows as Store[];
    return store || null;
  }

  async findById(id: number): Promise<Store | null> {
    const [rows] = await pool.execute(`SELECT * FROM stores WHERE id = ?`, [id]);
    const [store] = rows as Store[];
    return store || null;
  }
}
