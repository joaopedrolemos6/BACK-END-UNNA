import { Router } from "express";
import { productController } from "./factories";
import { ensureAuthenticated } from "../middlewares/ensureAuthenticated";
import { ensureRole } from "../middlewares/ensureRole";

const router = Router();

// Público
router.get("/", productController.list);
router.get("/:slug", productController.getBySlug);

// ADMIN (criação/edição)
router.post(
  "/",
  ensureAuthenticated,
  ensureRole("ADMIN"),
  productController.create
);

router.put(
  "/:id",
  ensureAuthenticated,
  ensureRole("ADMIN"),
  productController.update
);

export { router as productRoutes };
