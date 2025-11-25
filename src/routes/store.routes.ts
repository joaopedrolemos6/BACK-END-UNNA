import { Router } from "express";
import { storeController } from "./factories";

const router = Router();

router.get("/", storeController.list);
router.get("/:slug", storeController.getBySlug);

export { router as storeRoutes };
