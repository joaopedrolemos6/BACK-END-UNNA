import { Response, NextFunction } from "express";
import { AuthRequest } from "./ensureAuthenticated";
import { AppError } from "../errors/AppError";

export function ensureRole(...roles: string[]) {
  return (req: AuthRequest, _res: Response, next: NextFunction) => {
    if (!req.user) throw new AppError("Unauthorized", 401);

    if (!roles.includes(req.user.role)) {
      throw new AppError("Forbidden: insufficient permissions", 403);
    }

    return next();
  };
}
