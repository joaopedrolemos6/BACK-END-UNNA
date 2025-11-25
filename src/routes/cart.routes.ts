import { Router } from "express";
import { cartController } from "./factories";
import { ensureAuthenticated } from "../middlewares/ensureAuthenticated";

const router = Router();

router.get("/", ensureAuthenticated, cartController.getCart);
router.post("/add", ensureAuthenticated, cartController.addItem);
router.patch("/item/:itemId", ensureAuthenticated, cartController.updateItem);
router.delete("/item/:itemId", ensureAuthenticated, cartController.removeItem);

export { router as cartRoutes };
