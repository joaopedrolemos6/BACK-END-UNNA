import { Request, Response } from "express";
import { ProductService } from "../services/ProductService";

export class ProductController {
  constructor(private productService: ProductService) {}

  create = async (req: Request, res: Response) => {
    const product = await this.productService.create(req.body);
    return res.status(201).json(product);
  };

  update = async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const result = await this.productService.update(id, req.body);
    return res.json(result);
  };

  list = async (req: Request, res: Response) => {
    const products = await this.productService.list({
      categoryId: req.query.categoryId ? Number(req.query.categoryId) : undefined,
      search: req.query.search as string,
      featured: req.query.featured === "true"
    });

    return res.json(products);
  };

  getBySlug = async (req: Request, res: Response) => {
    const product = await this.productService.getBySlug(req.params.slug);
    return res.json(product);
  };
}
