import { Request, Response } from "express";
import { StoreService } from "../services/StoreService";

export class StoreController {
  constructor(private storeService: StoreService) {}

  list = async (_req: Request, res: Response) => {
    const stores = await this.storeService.list();
    return res.json(stores);
  };

  getBySlug = async (req: Request, res: Response) => {
    const store = await this.storeService.getBySlug(req.params.slug);
    return res.json(store);
  };
}
