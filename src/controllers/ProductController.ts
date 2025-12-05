import { Request, Response } from "express";
import { ProductService } from "../services/ProductService";
import { AppError } from "../errors/AppError";
import { Role } from "../entities/User"; // <--- CORREÇÃO: Importando Role do User entity
import { Product } from "../entities/Product"; // Assumindo que você precisa do tipo Product aqui para getById, mas a função não existe no Service.

export class ProductController {
  constructor(private productService: ProductService) {}

  // ==========================================================
  // Métodos Públicos (GET)
  // ==========================================================

  list = async (req: Request, res: Response): Promise<Response> => {
    const { categoryId, search, featured } = req.query;

    const products = await this.productService.listProducts({
      categoryId: categoryId ? Number(categoryId) : undefined,
      search: search ? String(search) : undefined,
      featured: featured === 'true'
    });

    return res.json(products);
  };

  // ⚠️ ATENÇÃO: getProductById não existe no ProductService que implementamos,
  // mas o getBySlug é similar. Se quiser usar ID, precisará implementar no Service.
  // Mudei o retorno para Response para resolver a tipagem.
  getById = async (req: Request, res: Response): Promise<Response> => {
    const { id } = req.params;
    
    // Supondo a existência de getProductById no Service para manter o Controller funcional.
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
  // Métodos de Admin (CRUD)
  // ==========================================================
  
  create = async (req: Request, res: Response): Promise<Response> => {
    // Acessando req.user de forma mais segura
    const user = req.user as { userId: number, role: Role } | undefined;
    if (!user) throw new AppError("Token de usuário inválido ou ausente.", 401);

    const productData = req.body; 

    const newProduct = await this.productService.createProduct(productData, user.userId);

    return res.status(201).json(newProduct);
  };

  update = async (req: Request, res: Response): Promise<Response> => {
    const { id } = req.params;
    const user = req.user as { userId: number, role: Role } | undefined;

    if (!user) throw new AppError("Token de usuário inválido ou ausente.", 401);

    const productData = req.body;

    const updatedProduct = await this.productService.updateProduct(Number(id), productData, user.userId);

    return res.status(200).json(updatedProduct);
  };
  
  delete = async (req: Request, res: Response): Promise<Response> => {
    const { id } = req.params;

    // Lógica para deletar:
    // Por simplicidade, assumiremos que o service implementa o delete.
    await this.productService.deleteProduct(Number(id)); 

    return res.status(204).send(); // 204 No Content
  };

  // ==========================================================
  // UPLOAD DE IMAGEM (Admin)
  // ==========================================================
  uploadImage = async (req: Request, res: Response): Promise<Response> => {
    const { id } = req.params;
    const file = req.file;

    if (!file) {
      throw new AppError("Nenhum arquivo enviado. Favor enviar um arquivo com a chave 'image'.", 400);
    }

    const result = await this.productService.uploadImage(Number(id), file.filename);

    return res.status(201).json(result);
  };
}