import { Request, Response } from "express";
import { ProductService } from "../../../services/ProductService";
import { AppError } from "../../../errors/AppError";

export class ProductImageController {
  constructor(private productService: ProductService) {}

  handle = async (req: Request, res: Response) => {
    const { id } = req.params; // ID do produto
    const file = req.file; // Arquivo vindo do Multer

    if (!file) {
      throw new AppError("No file uploaded. Please send a file with key 'image'.", 400);
    }

    const result = await this.productService.uploadImage(Number(id), file.filename);

    return res.status(201).json(result);
  };
}