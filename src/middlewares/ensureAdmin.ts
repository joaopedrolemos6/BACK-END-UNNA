import { Response, NextFunction } from "express";
import { AppError } from "../errors/AppError";
import { AuthRequest } from "./ensureAuthenticated"; // Importando a interface que definimos antes

export function ensureAdmin(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  const { user } = req;

  // O middleware ensureAuthenticated já deve ter rodado antes desse e preenchido o req.user
  if (!user) {
    throw new AppError("User not authenticated", 401);
  }

  if (user.role !== "ADMIN") {
    throw new AppError("Access denied: Admins only", 403);
  }

  return next();
}