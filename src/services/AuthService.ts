import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { IUserRepository } from "../repositories/interfaces/IUserRepository";
import { AppError } from "../errors/AppError";
import { env } from "../config/env";
import { loginSchema, registerSchema } from "../schemas/authSchemas";

export class AuthService {
  constructor(private userRepository: IUserRepository) {}

  async register(data: any) {
    const parsed = registerSchema.safeParse(data);
    if (!parsed.success) {
      throw new AppError("Invalid register data", 400, parsed.error.format());
    }

    const { name, email, password } = parsed.data;

    const existing = await this.userRepository.findByEmail(email);
    if (existing) {
      throw new AppError("Email already registered", 409);
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

  async login(data: any) {
    const parsed = loginSchema.safeParse(data);
    if (!parsed.success) {
      throw new AppError("Invalid login data", 400, parsed.error.format());
    }

    const { email, password } = parsed.data;

    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new AppError("Invalid credentials", 401);
    }

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) {
      throw new AppError("Invalid credentials", 401);
    }

    const accessToken = jwt.sign(
      {
        sub: user.id,
        role: user.role
      },
      env.JWT_ACCESS_SECRET,
      { expiresIn: env.JWT_ACCESS_EXPIRES_IN }
    );

    const refreshToken = jwt.sign(
      {
        sub: user.id,
        role: user.role
      },
      env.JWT_REFRESH_SECRET,
      { expiresIn: env.JWT_REFRESH_EXPIRES_IN }
    );

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      tokens: {
        accessToken,
        refreshToken
      }
    };
  }
}
