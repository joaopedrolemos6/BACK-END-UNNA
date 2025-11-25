import { Router } from "express";
import { orderController } from "./factories";
import { ensureAuthenticated } from "../middlewares/ensureAuthenticated";

const router = Router();

/**
 * Criar pedido
 * POST /api/orders
 */
router.post("/", ensureAuthenticated, orderController.create);

/**
 * Buscar detalhes completos do pedido
 * GET /api/orders/:orderNumber
 */
router.get("/:orderNumber", ensureAuthenticated, orderController.getDetails);

export { router as orderRoutes };
