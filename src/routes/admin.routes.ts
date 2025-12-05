import { Router } from "express";
import multer from "multer";

// Importe sua config de upload
import uploadConfig from "../config/upload";

// Importe suas controllers e services (ajuste os caminhos conforme sua estrutura)
import { ProductImageController } from "../controllers/ProductImageController";
import { ProductController } from "../controllers/ProductController"; // Importado ProductController
import { CategoryController } from "../controllers/CategoryController"; // Importado CategoryController
import { OrderController } from "../controllers/OrderController"; // Importado OrderController
import { ProductService } from "../services/ProductService";
import { ProductRepository } from "../repositories/mysql/ProductRepository";
import { ensureAuthenticated } from "../middlewares/ensureAuthenticated";
import { ensureAdmin } from "../middlewares/ensureAdmin";
import { categoryController, productController, orderController } from "./factories"; // Importando as factories

const adminRoutes = Router();

// Configura o Multer
const upload = multer(uploadConfig);

// As instâncias dos controllers (productController, categoryController, orderController) 
// já vêm do arquivo factories.ts importado acima.

// Aplicando middlewares de autenticação e Admin para todas as rotas de admin
adminRoutes.use(ensureAuthenticated, ensureAdmin);


// ==========================================================
// ROTAS DE CATEGORIA (ADMIN)
// ==========================================================
// POST /api/admin/categories
adminRoutes.post("/categories", categoryController.create);
// PUT /api/admin/categories/:id
adminRoutes.put("/categories/:id", categoryController.update);
// DELETE /api/admin/categories/:id
adminRoutes.delete("/categories/:id", categoryController.delete);


// ==========================================================
// ROTAS DE PRODUTO (ADMIN)
// ==========================================================
// POST /api/admin/products
adminRoutes.post("/products", productController.create); // Cria produto (sem imagem)
// PUT /api/admin/products/:id
adminRoutes.put("/products/:id", productController.update); // Atualiza dados do produto
// DELETE /api/admin/products/:id
adminRoutes.delete("/products/:id", productController.delete); // Deleta produto


// ==========================================================
// ROTA DE UPLOAD DE IMAGEM (JÁ EXISTENTE, mas melhor usar a factory)
// POST /api/admin/products/:id/images
adminRoutes.post(
  "/products/:id/images",
  upload.single("image"), // 'image' é o nome do campo
  productController.uploadImage // Usando o método do ProductController
);


// ==========================================================
// ROTAS DE PEDIDOS (ADMIN)
// ==========================================================
// GET /api/admin/orders
adminRoutes.get("/orders", orderController.listAdminOrders);
// PATCH /api/admin/orders/:id/status (ex: para "SENT" ou "DELIVERED")
adminRoutes.patch("/orders/:id/status", orderController.updateOrderStatus);


export { adminRoutes };