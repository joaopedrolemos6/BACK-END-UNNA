import { IUserRepository } from "../interfaces/IUserRepository";
import { pool } from "../../config/database";
import { User } from "../../entities/User";

export class UserRepository implements IUserRepository {
  async create(data: Omit<User, "id" | "createdAt" | "updatedAt">): Promise<User> {
    const [result] = await pool.execute(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES (?, ?, ?, ?)`,
      [data.name, data.email, data.passwordHash, data.role]
    );

    const insertId = (result as any).insertId;
    return await this.findById(insertId) as User;
  }

  async findByEmail(email: string): Promise<User | null> {
    const [rows] = await pool.execute(`SELECT * FROM users WHERE email = ?`, [email]);
    const [user] = rows as User[];
    return user || null;
  }

  async findById(id: number): Promise<User | null> {
    const [rows] = await pool.execute(`SELECT * FROM users WHERE id = ?`, [id]);
    const [user] = rows as User[];
    return user || null;
  }

  async updateRole(id: number, role: User["role"]): Promise<void> {
    await pool.execute(`UPDATE users SET role = ? WHERE id = ?`, [role, id]);
  }
}
