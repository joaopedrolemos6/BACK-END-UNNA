import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { IUserRepository } from "../repositories/interfaces/IUserRepository";
import { AppError } from "../errors/AppError";
import { env } from "../config/env";
import { loginSchema, registerSchema } from "../schemas/authSchemas";

export class AuthService {
  constructor(private userRepository: IUserRepository) {}

  // ==========================================================
  // 1. REGISTRO
  // ==========================================================
  async register(data: any) {
    const parsed = registerSchema.safeParse(data);
    if (!parsed.success) {
      throw new AppError("Dados inválidos", 400, parsed.error.format());
    }

    const { name, email, password } = parsed.data;

    const existing = await this.userRepository.findByEmail(email);
    if (existing) {
      throw new AppError("E-mail já cadastrado.", 409);
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await this.userRepository.create({
      name,
      email,
      role: "CUSTOMER",
      passwordHash
    });

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    };
  }

  // ==========================================================
  // 2. LOGIN
  // ==========================================================
  async login(data: any) {
    const parsed = loginSchema.safeParse(data);
    if (!parsed.success) {
      throw new AppError("Credenciais inválidas", 400, parsed.error.format());
    }

    const { email, password } = parsed.data;

    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new AppError("E-mail ou senha incorretos.", 401);
    }

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) {
      throw new AppError("E-mail ou senha incorretos.", 401);
    }

    // Gerar tokens
    const tokens = this.generateTokens(user);

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      tokens
    };
  }

  // ==========================================================
  // 3. REFRESH TOKEN (NOVO)
  // ==========================================================
  async refreshToken(token: string) {
    if (!token) {
      throw new AppError("Refresh token is required", 401);
    }

    try {
      // 1. Verificar se o refresh token é válido
      const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET as string) as any;
      
      // 2. Buscar usuário para garantir que ele ainda existe
      const user = await this.userRepository.findById(Number(decoded.sub));

      if (!user) {
        throw new AppError("User not found", 401);
      }

      // 3. Gerar novos tokens
      const newTokens = this.generateTokens(user);

      return newTokens;

    } catch (error) {
      throw new AppError("Invalid or expired refresh token", 401);
    }
  }

  // ==========================================================
  // HELPER: GERAÇÃO DE TOKENS
  // ==========================================================
  private generateTokens(user: any) {
    const accessToken = jwt.sign(
      {
        sub: String(user.id), // Importante converter para string
        role: user.role
      },
      env.JWT_ACCESS_SECRET,
      { expiresIn: env.JWT_ACCESS_EXPIRES_IN }
    );

    const refreshToken = jwt.sign(
      {
        sub: String(user.id),
        role: user.role
      },
      env.JWT_REFRESH_SECRET as string,
      { expiresIn: env.JWT_REFRESH_EXPIRES_IN }
    );

    return { accessToken, refreshToken };
  }
}