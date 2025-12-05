import { Request, Response } from "express";
import { UserService } from "../services/UserService";
import { AppError } from "../errors/AppError";
import { Role } from "../entities/User";

export class UserController {
  constructor(private userService: UserService) {}

  // ==========================================================
  // 1. Rotas de Usuário (Profile)
  // ==========================================================
  getProfile = async (req: Request, res: Response): Promise<Response> => {
    // req.user é injetado pelo middleware ensureAuthenticated
    const { userId } = req.user as { userId: number };
    
    const user = await this.userService.findById(userId);
    
    if (!user) {
      // Isso teoricamente não deve acontecer se o token é válido
      throw new AppError("Usuário não encontrado.", 404);
    }
    
    // Removemos a senha antes de enviar
    const { passwordHash, ...userWithoutPassword } = user;
    
    return res.json(userWithoutPassword);
  };
  
  // Atualiza o próprio perfil (não pode mudar a role)
  updateProfile = async (req: Request, res: Response): Promise<Response> => {
    const { userId } = req.user as { userId: number };
    const data = req.body;
    
    // Remove campos que não devem ser alterados aqui
    delete data.role;
    delete data.password;

    const updatedUser = await this.userService.updateProfile(userId, data);
    
    const { passwordHash, ...userWithoutPassword } = updatedUser;
    
    return res.json(userWithoutPassword);
  };

  // ==========================================================
  // 2. Rotas de Admin (Gerenciar outros usuários)
  // ==========================================================

  // (GET /api/admin/users)
  listUsers = async (req: Request, res: Response): Promise<Response> => {
    // Implementar lógica de busca no UserService (findMany)
    // Por enquanto, vamos retornar uma lista estática/vazia
    return res.json([]); 
  };
  
  // (GET /api/admin/users/:id)
  getUserById = async (req: Request, res: Response): Promise<Response> => {
    const id = Number(req.params.id);
    const user = await this.userService.findById(id);

    if (!user) {
      throw new AppError("Usuário não encontrado.", 404);
    }

    const { passwordHash, ...userWithoutPassword } = user;
    return res.json(userWithoutPassword);
  };

  // (PUT /api/admin/users/:id)
  updateUserByAdmin = async (req: Request, res: Response): Promise<Response> => {
    const id = Number(req.params.id);
    const { userId } = req.user as { userId: number, role: Role };

    // Admin pode atualizar o perfil, inclusive a role
    const updatedUser = await this.userService.updateProfile(id, req.body);
    
    const { passwordHash, ...userWithoutPassword } = updatedUser;
    return res.json(userWithoutPassword);
  };
  
  // (DELETE /api/admin/users/:id)
  deleteUser = async (req: Request, res: Response): Promise<Response> => {
    const id = Number(req.params.id);
    
    // Prevenção: Admin não pode deletar a si próprio
    if (id === req.user?.userId) {
        throw new AppError("Você não pode deletar sua própria conta via esta rota.", 403);
    }

    await this.userService.deleteUser(id);

    return res.status(204).send();
  };
}