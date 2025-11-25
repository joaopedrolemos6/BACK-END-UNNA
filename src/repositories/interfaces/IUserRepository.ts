import { User } from "../../entities/User";

export interface IUserRepository {
  create(user: Omit<User, "id" | "createdAt" | "updatedAt" | "passwordHash"> & { passwordHash: string }): Promise<User>;
  findByEmail(email: string): Promise<User | null>;
  findById(id: number): Promise<User | null>;
  updateRole(id: number, role: User["role"]): Promise<void>;
}

