// src/routes/admin.routes.ts

import { Router } from "express";
// Importamos a instância 'upload' (que é o multer configurado com diskStorage)
import { upload } from "../config/upload"; 
import { 
    productController, 
    categoryController, 
    orderController, 
    productImageController // Controlador de Imagem garantido pelo factories
} from "./factories";
import { ensureAuthenticated } from "../middlewares/ensureAuthenticated";
import { ensureAdmin } from "../middlewares/ensureAdmin";

const adminRoutes = Router();

// Aplica autenticação e autorização de admin para todas as rotas admin
adminRoutes.use(ensureAuthenticated, ensureAdmin);

// Rotas de Produtos (CRUD)
adminRoutes.post("/products", productController.create);
adminRoutes.get("/products", productController.list);
adminRoutes.put("/products/:id", productController.update);
adminRoutes.delete("/products/:id", productController.delete);

// Rota de Upload de Imagem (Ponto 2.4 Corrigido)
// Chamamos o método .single('image') do objeto 'upload' para criar o middleware on-the-fly
adminRoutes.post(
  "/products/:id/images",
  upload.single("image"), // <-- Uso correto do middleware multer/upload
  productImageController.upload // O callback que armazena no DB
);

// Rotas de Categorias (CRUD)
adminRoutes.post("/categories", categoryController.create);
adminRoutes.get("/categories", categoryController.list);
adminRoutes.put("/categories/:id", categoryController.update);
adminRoutes.delete("/categories/:id", categoryController.delete);

// Rotas de Pedidos
adminRoutes.get("/orders", orderController.listAllOrders);
adminRoutes.put("/orders/:id/status", orderController.updateStatus);

export default adminRoutes;