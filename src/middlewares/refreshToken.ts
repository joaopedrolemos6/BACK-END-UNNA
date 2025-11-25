import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { AppError } from "../errors/AppError";

export function refreshTokenHandler(req: Request, res: Response, _next: NextFunction) {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    throw new AppError("Refresh token is required", 400);
  }

  try {
    const decoded = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET) as any;

    const accessToken = jwt.sign(
      { sub: decoded.sub, role: decoded.role },
      env.JWT_ACCESS_SECRET,
      { expiresIn: env.JWT_ACCESS_EXPIRES_IN }
    );

    return res.json({
      accessToken
    });

  } catch (err) {
    throw new AppError("Invalid refresh token", 401);
  }
}
