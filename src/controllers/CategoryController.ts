import { Request, Response } from "express";
import { CategoryService } from "../services/CategoryService";

export class CategoryController {
  constructor(private categoryService: CategoryService) {}

  list = async (_req: Request, res: Response) => {
    const categories = await this.categoryService.getAll();
    return res.json(categories);
  };

  getBySlug = async (req: Request, res: Response) => {
    const category = await this.categoryService.getBySlug(req.params.slug);
    return res.json(category);
  };
}
