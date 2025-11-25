import { Router } from "express";
import { authRoutes } from "./auth.routes";
import { categoryRoutes } from "./category.routes";
import { productRoutes } from "./product.routes";
import { storeRoutes } from "./store.routes";
import { cartRoutes } from "./cart.routes";
import { orderRoutes } from "./order.routes";
import { adminRoutes } from "./admin.routes";
import { mercadoPagoRoutes } from "./mercadopago.routes";


const router = Router();

router.use("/auth", authRoutes);
router.use("/categories", categoryRoutes);
router.use("/products", productRoutes);
router.use("/stores", storeRoutes);
router.use("/cart", cartRoutes);
router.use("/orders", orderRoutes);
router.use("/admin", adminRoutes);
router.use("/mercadopago", mercadoPagoRoutes);


export { router };
