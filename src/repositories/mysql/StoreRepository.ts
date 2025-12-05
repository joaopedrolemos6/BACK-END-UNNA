import { IStoreRepository } from "../interfaces/IStoreRepository";
import { pool } from "../../config/database";
import { Store } from "../../entities/Store"; // Certifique-se que o import de Store existe

export class StoreRepository implements IStoreRepository {
    
    // Simplesmente retorna uma lista de lojas (assumindo que já existe no banco)
    async findAll(): Promise<Store[]> {
        const [rows] = await pool.execute(`SELECT * FROM stores WHERE status = 'active'`);
        return rows as Store[];
    }
    
    // Método para buscar pelo slug (necessário para o Front-end)
    async findBySlug(slug: string): Promise<Store | null> {
        const [rows]: any = await pool.execute(`SELECT * FROM stores WHERE slug = ? AND status = 'active'`, [slug]);
        return rows[0] || null;
    }
    
    // Nota: Métodos de CRUD para Admin (create, update, delete) seriam implementados aqui.
}