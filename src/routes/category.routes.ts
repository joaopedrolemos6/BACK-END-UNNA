import { Router } from "express";
import { categoryController } from "./factories";

const router = Router();

router.get("/", categoryController.list);
router.get("/:slug", categoryController.getBySlug);

export { router as categoryRoutes };
