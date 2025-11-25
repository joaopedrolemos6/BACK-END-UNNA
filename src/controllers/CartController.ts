import { Response } from "express";
import { CartService } from "../services/CartService";
import { AuthRequest } from "../middlewares/ensureAuthenticated";

export class CartController {
  constructor(private cartService: CartService) {}

  getCart = async (req: AuthRequest, res: Response) => {
    const result = await this.cartService.getItems(req.user!.id);
    return res.json(result);
  };

  addItem = async (req: AuthRequest, res: Response) => {
    const item = await this.cartService.addItem(req.user!.id, req.body);
    return res.status(201).json(item);
  };

  updateItem = async (req: AuthRequest, res: Response) => {
    const itemId = Number(req.params.itemId);
    const result = await this.cartService.updateItem(req.user!.id, itemId, req.body);
    return res.json(result);
  };

  removeItem = async (req: AuthRequest, res: Response) => {
    const itemId = Number(req.params.itemId);
    const result = await this.cartService.removeItem(req.user!.id, itemId);
    return res.json(result);
  };
}
