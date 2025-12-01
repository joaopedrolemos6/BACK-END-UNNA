import { AuthService } from "../services/AuthService";
import { CategoryService } from "../services/CategoryService";
import { ProductService } from "../services/ProductService";
import { StoreService } from "../services/StoreService";
import { CartService } from "../services/CartService";
import { OrderService } from "../services/OrderService";
import { PaymentService } from "../services/PaymentService";

import { AuthController } from "../controllers/AuthController";
import { CategoryController } from "../controllers/CategoryController";
import { ProductController } from "../controllers/ProductController";
import { StoreController } from "../controllers/StoreController";
import { CartController } from "../controllers/CartController";
import { OrderController } from "../controllers/OrderController";
import { PaymentController } from "../controllers/PaymentController";

import { UserRepository } from "../repositories/mysql/UserRepository";
import { CategoryRepository } from "../repositories/mysql/CategoryRepository";
import { ProductRepository } from "../repositories/mysql/ProductRepository";
import { StoreRepository } from "../repositories/mysql/StoreRepository";
import { CartRepository } from "../repositories/mysql/CartRepository";
import { OrderRepository } from "../repositories/mysql/OrderRepository";

// Repositories
const userRepo = new UserRepository();
const categoryRepo = new CategoryRepository();
const productRepo = new ProductRepository();
const storeRepo = new StoreRepository();
const cartRepo = new CartRepository();
const orderRepo = new OrderRepository();

// Services
const authService = new AuthService(userRepo);
const categoryService = new CategoryService(categoryRepo);
const storeService = new StoreService(storeRepo);
const productService = new ProductService(productRepo);
const cartService = new CartService(cartRepo, productRepo);

// 🔥 Atualizado: Injeção do productRepo no PaymentService para controle de estoque
const paymentService = new PaymentService(orderRepo, productRepo);

const orderService = new OrderService(
  orderRepo,
  cartRepo,
  productRepo,
  storeService,
  paymentService
);

// Controllers
export const authController = new AuthController(authService);
export const categoryController = new CategoryController(categoryService);
export const storeController = new StoreController(storeService);
export const productController = new ProductController(productService);
export const cartController = new CartController(cartService);
export const orderController = new OrderController(orderService);
export const paymentController = new PaymentController(paymentService);