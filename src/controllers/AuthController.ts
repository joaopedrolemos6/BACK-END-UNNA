import { Request, Response } from "express";
import { AuthService } from "../services/AuthService";

export class AuthController {
  constructor(private authService: AuthService) {}

  register = async (req: Request, res: Response) => {
    const result = await this.authService.register(req.body);
    return res.status(201).json(result);
  };

  login = async (req: Request, res: Response) => {
    const result = await this.authService.login(req.body);
    return res.json(result);
  };
}
