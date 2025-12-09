// src/routes/factories.ts

import { UserRepository } from "../repositories/mysql/UserRepository";
import { ProductRepository } from "../repositories/mysql/ProductRepository";
import { CategoryRepository } from "../repositories/mysql/CategoryRepository";
import { OrderRepository } from "../repositories/mysql/OrderRepository";
import { CartRepository } from "../repositories/mysql/CartRepository";
import { StoreRepository } from "../repositories/mysql/StoreRepository";

import { AuthService } from "../services/AuthService";
import { UserService } from "../services/UserService";
import { ProductService } from "../services/ProductService";
import { CategoryService } from "../services/CategoryService";
import { CartService } from "../services/CartService";
import { OrderService } from "../services/OrderService";
import { PaymentService } from "../services/PaymentService";
import { WebhookService } from "../services/webhookService";

import { AuthController } from "../controllers/AuthController";
import { UserController } from "../controllers/UserController";
import { ProductController } from "../controllers/ProductController";
import { CategoryController } from "../controllers/CategoryController";
import { CartController } from "../controllers/CartController";
import { OrderController } from "../controllers/OrderController";
import { PaymentController } from "../controllers/PaymentController";
import { StoreController } from "../controllers/StoreController";

// >> IMPORTAÇÕES DE CLASSES <<
import { MercadoPagoWebhookController } from "../controllers/mercadoPagoWebhookController"; // Corrigido Named Import
import { ProductImageController } from "../controllers/ProductImageController"; 


// Repositories
const userRepository = new UserRepository();
const productRepository = new ProductRepository();
const categoryRepository = new CategoryRepository();
const orderRepository = new OrderRepository(); 
const cartRepository = new CartRepository();
const storeRepository = new StoreRepository();

// Services
export const authService = new AuthService(userRepository);
export const userService = new UserService(userRepository);
export const productService = new ProductService(productRepository, categoryRepository);
export const categoryService = new CategoryService(categoryRepository);
export const cartService = new CartService(cartRepository, productRepository);
export const orderService = new OrderService(orderRepository, productRepository, cartRepository);
export const paymentService = new PaymentService(orderService);
export const webhookService = new WebhookService(orderRepository, productRepository);


// Controllers
export const authController = new AuthController(authService);
export const userController = new UserController(userService);
export const productController = new ProductController(productService);
export const categoryController = new CategoryController(categoryService);
export const cartController = new CartController(cartService);
export const orderController = new OrderController(orderService, paymentService);
export const paymentController = new PaymentController(paymentService);
export const storeController = new StoreController(storeRepository);
export const productImageController = new ProductImageController(productService);


// Instanciando o Controller do Webhook (Linha 65 Corrigida)
export const mercadoPagoWebhookController = new MercadoPagoWebhookController(webhookService, paymentService, orderController);


// Exporta todos os controllers (padrão de exportação default)
export default {
    authController,
    userController,
    productController,
    categoryController,
    cartController,
    orderController,
    paymentController,
    storeController,
    productImageController, 
    mercadoPagoWebhookController,
};