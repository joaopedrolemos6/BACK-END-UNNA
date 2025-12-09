import { Request, Response } from "express";
import { ProductService } from "../services/ProductService";
import { AppError } from "../errors/AppError";
import { Role } from "../entities/User";

export class ProductController {
  constructor(private productService: ProductService) {}

  // ==========================================================
  // GET – Público
  // ==========================================================
  
  list = async (req: Request, res: Response): Promise<Response> => {
    const { categoryId, search, featured } = req.query;

    const products = await this.productService.listProducts({
      categoryId: categoryId ? Number(categoryId) : undefined,
      search: search ? String(search) : undefined,
      featured: featured === "true",
    });

    return res.json(products);
  };

  getById = async (req: Request, res: Response): Promise<Response> => {
    const { id } = req.params;

    const product = await this.productService.getProductById(Number(id));

    if (!product) {
      throw new AppError("Produto não encontrado.", 404);
    }

    return res.json(product);
  };

  getBySlug = async (req: Request, res: Response): Promise<Response> => {
    const { slug } = req.params;

    const product = await this.productService.getProductBySlug(slug);

    return res.json(product);
  };

  // ==========================================================
  // ADMIN – CRUD de Produtos
  // ==========================================================

  create = async (req: Request, res: Response): Promise<Response> => {
    const user = req.user as { userId: number; role: Role } | undefined;

    if (!user) throw new AppError("Token de usuário inválido ou ausente.", 401);

    const productData = req.body;

    const newProduct = await this.productService.createProduct(
      productData,
      user.userId
    );

    return res.status(201).json(newProduct);
  };

  update = async (req: Request, res: Response): Promise<Response> => {
    const { id } = req.params;

    const user = req.user as { userId: number; role: Role } | undefined;
    if (!user) throw new AppError("Token de usuário inválido ou ausente.", 401);

    const productData = req.body;

    const updatedProduct = await this.productService.updateProduct(
      Number(id),
      productData,
      user.userId
    );

    return res.json(updatedProduct);
  };

  delete = async (req: Request, res: Response): Promise<Response> => {
    const { id } = req.params;

    await this.productService.deleteProduct(Number(id));

    return res.status(204).send();
  };

  // ==========================================================
  // ADMIN – Upload de Imagens
  // ==========================================================

  uploadImage = async (req: Request, res: Response): Promise<Response> => {
    const { id } = req.params;
    const file = req.file;

    if (!file) {
      throw new AppError(
        "Nenhum arquivo enviado. Envie uma imagem usando a chave 'image'.",
        400
      );
    }

    // Apenas filename, pois o upload já salva em /uploads
    const savedImage = await this.productService.uploadImage(
      Number(id),
      file.filename
    );

    return res.status(201).json(savedImage);
  };
}
