import { Router } from "express";
import multer from "multer";

// Importe sua config de upload
import uploadConfig from "../config/upload";

// Importe suas controllers e services (ajuste os caminhos conforme sua estrutura)
import { ProductImageController } from "../modules/admin/products/ProductImageController";
import { ProductService } from "../services/ProductService";
import { ProductRepository } from "../repositories/ProductRepository";
import { ensureAuthenticated } from "../middlewares/ensureAuthenticated";
import { ensureAdmin } from "../middlewares/ensureAdmin";

const adminRouter = Router();

// Configura o Multer
const upload = multer(uploadConfig);

// Instância das dependências (Factory manual)
const productRepository = new ProductRepository();
const productService = new ProductService(productRepository); // Adicione outras deps se precisar
const productImageController = new ProductImageController(productService);

// ... outras rotas de admin ...

// ROTA DE UPLOAD
// POST /api/admin/products/:id/images
adminRouter.post(
  "/products/:id/images",
  ensureAuthenticated,
  ensureAdmin,
  upload.single("image"), // 'image' é o nome do campo que vamos usar no Insomnia
  productImageController.handle
);

export { adminRouter };