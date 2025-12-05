import { AuthController } from "../controllers/AuthController";
import { UserController } from "../controllers/UserController";
import { CategoryController } from "../controllers/CategoryController";
import { ProductController } from "../controllers/ProductController"; // Adicionado
import { CartController } from "../controllers/CartController";
import { OrderController } from "../controllers/OrderController";
import { PaymentController } from "../controllers/PaymentController";
import { MercadoPagoController } from "../controllers/MercadoPagoController"; // Adicionado

import { UserRepository } from "../repositories/mysql/UserRepository";
import { CartRepository } from "../repositories/mysql/CartRepository";
import { CategoryRepository } from "../repositories/mysql/CategoryRepository";
import { ProductRepository } from "../repositories/mysql/ProductRepository"; // Adicionado
import { OrderRepository } from "../repositories/mysql/OrderRepository";

import { AuthService } from "../services/AuthService";
import { UserService } from "../services/UserService";
import { CartService } from "../services/CartService";
import { CategoryService } from "../services/CategoryService";
import { ProductService } from "../services/ProductService"; // Adicionado
import { OrderService } from "../services/OrderService";
import { PaymentService } from "../services/PaymentService"; // Adicionado


// Repositórios
const userRepository = new UserRepository();
const cartRepository = new CartRepository();
const categoryRepository = new CategoryRepository();
const productRepository = new ProductRepository();
const orderRepository = new OrderRepository();


// Serviços
const userService = new UserService(userRepository);
const authService = new AuthService(userRepository);
const cartService = new CartService(cartRepository, productRepository);
const categoryService = new CategoryService(categoryRepository);
const productService = new ProductService(productRepository); // Instância do ProductService
const paymentService = new PaymentService(orderRepository, productRepository); // Instância do PaymentService
const orderService = new OrderService(orderRepository, cartRepository, productService, paymentService);


// Controllers
export const authController = new AuthController(authService);
export const userController = new UserController(userService);
export const cartController = new CartController(cartService);
export const categoryController = new CategoryController(categoryService);
export const orderController = new OrderController(orderService);
export const paymentController = new PaymentController();
export const mercadoPagoController = new MercadoPagoController(paymentService); // Adicionado
export const productController = new ProductController(productService); // <-- ADICIONADO AQUI