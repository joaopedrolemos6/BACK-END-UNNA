import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { AppError } from "../errors/AppError";
import { env } from "../config/env";

export interface AuthRequest extends Request {
  user?: {
    id: number;
    role: string;
  };
}

export function ensureAuthenticated(
  req: AuthRequest,
  _res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;
  if (!authHeader) throw new AppError("Unauthorized", 401);

  const [, token] = authHeader.split(" ");

  try {
    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as any;

    req.user = {
      id: Number(decoded.sub),
      role: decoded.role
    };

    return next();
  } catch (error) {
    throw new AppError("Invalid or expired token", 401);
  }
}
