import { Router } from "express";
import { storeController } from "../controllers/StoreController";

const router = Router();

router.get("/", storeController.list);

export { router as storeRoutes };
