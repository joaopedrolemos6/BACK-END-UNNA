import { NextFunction, Request, Response } from 'express';
import { AppError } from '../errors/AppError';
import { env } from '../config/env';

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      status: 'error',
      message: err.message,
      details: err.details ?? undefined
    });
  }

  console.error(err);

  if (env.NODE_ENV === 'production') {
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  } 

  return res.status(500).json({
    status: 'error',
    message: err.message,
    stack: err.stack
  });
}
