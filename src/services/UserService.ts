import { IUserRepository } from "../repositories/interfaces/IUserRepository";
import { User, Role } from "../entities/User";
import { AppError } from "../errors/AppError";
import * as bcrypt from "bcryptjs"; // Importando bcrypt

export class UserService {
  constructor(private userRepository: IUserRepository) {}

  // ==========================================================
  // 1. GESTÃO BÁSICA (GETS)
  // ==========================================================
  async findById(id: number): Promise<User | null> {
    return this.userRepository.findById(id);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findByEmail(email);
  }
  
  // ==========================================================
  // 2. CRIAÇÃO/REGISTRO (Usado pelo AuthService, mas bom ter aqui)
  // ==========================================================
  async registerUser(name: string, email: string, passwordPlain: string, role: Role = Role.CUSTOMER): Promise<User> {
    if (await this.userRepository.findByEmail(email)) {
      throw new AppError("O email já está em uso.", 409); // 409 Conflict
    }

    const passwordHash = await bcrypt.hash(passwordPlain, 10);

    const newUser = {
      name,
      email,
      passwordHash,
      role
    };

    return this.userRepository.create(newUser);
  }

  // ==========================================================
  // 3. ATUALIZAÇÃO (ADMIN/Usuário)
  // ==========================================================
  async updateProfile(userId: number, data: Partial<User>): Promise<User> {
    const userExists = await this.userRepository.findById(userId);
    if (!userExists) {
        throw new AppError("Usuário não encontrado.", 404);
    }

    if (data.email && data.email !== userExists.email) {
        const emailInUse = await this.userRepository.findByEmail(data.email);
        if (emailInUse) {
             throw new AppError("O novo email já está em uso.", 409);
        }
    }

    // A atualização de senha deve ser feita em um método separado (updatePassword)
    const updateData: Partial<User> = {
      name: data.name,
      email: data.email,
      role: data.role, // Admin pode mudar a role
    };

    // Remove undefined fields
    Object.keys(updateData).forEach(key => 
        (updateData as any)[key] === undefined && delete (updateData as any)[key]
    );

    await this.userRepository.update(userId, updateData);

    return (await this.userRepository.findById(userId)) as User;
  }
  
  async updatePassword(userId: number, oldPasswordPlain: string, newPasswordPlain: string): Promise<void> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
        throw new AppError("Usuário não encontrado.", 404);
    }

    const isMatch = await bcrypt.compare(oldPasswordPlain, user.passwordHash);
    if (!isMatch) {
        throw new AppError("Senha atual incorreta.", 401);
    }

    user.passwordHash = await bcrypt.hash(newPasswordPlain, 10);
    await this.userRepository.update(userId, { passwordHash: user.passwordHash });
  }
  
  // ==========================================================
  // 4. DELETAR
  // ==========================================================
  async deleteUser(id: number): Promise<void> {
    await this.userRepository.delete(id);
  }
}