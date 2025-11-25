import { Request, Response } from 'express';
import { testDatabaseConnection } from '../../config/database';

export async function healthController(req: Request, res: Response) {
  try {
    await testDatabaseConnection();
    return res.status(200).json({
      status: 'ok',
      database: 'connected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      database: 'disconnected',
      timestamp: new Date().toISOString()
    });
  }
}
