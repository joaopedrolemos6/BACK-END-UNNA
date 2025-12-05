import { Router } from "express";
import { storeController } from "./factories"; // <-- Importe apenas o que foi exportado!

const router = Router();

// ==========================================================
// ROTAS PÚBLICAS DA LOJA
// ==========================================================

// GET /api/stores (Lista todas as lojas)
router.get("/", storeController.list);

// GET /api/stores/:slug (Detalhe da loja pelo slug)
router.get("/:slug", storeController.getBySlug);

// Nota: Outras rotas como "/products" e "/categories" são geralmente tratadas 
// em seus próprios arquivos (product.routes.ts, category.routes.ts), 
// mas se for por slug de loja, ficaria aqui.

export { router as storeRoutes };