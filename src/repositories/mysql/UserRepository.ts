import { IUserRepository } from "../interfaces/IUserRepository";
import { pool } from "../../config/database";
import { User } from "../../entities/User";

export class UserRepository implements IUserRepository {
  
  // ==========================================================
  // 1. CRIAR USUÁRIO
  // ==========================================================
  async create(data: Omit<User, "id" | "createdAt" | "updatedAt">): Promise<User> {
    const [result] = await pool.execute(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES (?, ?, ?, ?)`,
      [data.name, data.email, data.passwordHash, data.role]
    );

    const insertId = (result as any).insertId;
    // Buscamos o usuário recém-criado para retornar o objeto completo mapeado
    const user = await this.findById(insertId);
    
    if (!user) {
        throw new Error("Erro fatal: Usuário criado não encontrado.");
    }
    
    return user;
  }

  // ==========================================================
  // 2. BUSCAR POR EMAIL (COM MAPEAMENTO)
  // ==========================================================
  async findByEmail(email: string): Promise<User | null> {
    const [rows] = await pool.execute(`SELECT * FROM users WHERE email = ?`, [email]);
    const rowsData = rows as any[];

    if (rowsData.length === 0) return null;

    const raw = rowsData[0];

    return this.mapToEntity(raw);
  }

  // ==========================================================
  // 3. BUSCAR POR ID (COM MAPEAMENTO)
  // ==========================================================
  async findById(id: number): Promise<User | null> {
    const [rows] = await pool.execute(`SELECT * FROM users WHERE id = ?`, [id]);
    const rowsData = rows as any[];

    if (rowsData.length === 0) return null;

    const raw = rowsData[0];

    return this.mapToEntity(raw);
  }

  // ==========================================================
  // 4. ATUALIZAR ROLE
  // ==========================================================
  async updateRole(id: number, role: User["role"]): Promise<void> {
    await pool.execute(`UPDATE users SET role = ?, updated_at = NOW() WHERE id = ?`, [role, id]);
  }

  // ==========================================================
  // HELPER: Converte snake_case (Banco) -> camelCase (Entidade)
  // ==========================================================
  private mapToEntity(raw: any): User {
    return {
      id: raw.id,
      name: raw.name,
      email: raw.email,
      passwordHash: raw.password_hash, // AQUI ESTAVA O ERRO
      role: raw.role,
      createdAt: raw.created_at,       // Mapeando data também
      updatedAt: raw.updated_at
    };
  }
}