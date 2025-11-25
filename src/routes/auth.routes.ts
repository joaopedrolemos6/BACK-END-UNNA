import { Router } from "express";
import { authController } from "./factories";
import { refreshTokenHandler } from "../middlewares/refreshToken";

const router = Router();

router.post("/register", authController.register);
router.post("/login", authController.login);
router.post("/refresh", refreshTokenHandler);

export { router as authRoutes };
