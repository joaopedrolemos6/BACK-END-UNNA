import { Router } from "express";
import { ensureAuthenticated } from "../middlewares/ensureAuthenticated";
import { ensureRole } from "../middlewares/ensureRole";
import { productController } from "./factories";
// futuros controllers: metrics, dashboards

const router = Router();

router.use(ensureAuthenticated, ensureRole("ADMIN"));

// Produtos (CRUD Admin)
router.post("/products", productController.create);
router.put("/products/:id", productController.update);

export { router as adminRoutes };
