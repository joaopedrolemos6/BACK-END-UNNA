import { Request, Response } from "express";
import { OrderService } from "../services/OrderService";
import { AuthRequest } from "../middlewares/ensureAuthenticated";

export class OrderController {
  constructor(private orderService: OrderService) {}

  /**
   * ==========================================================
   * 1. Criar Pedido
   * ==========================================================
   */
  create = async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;

    const result = await this.orderService.createOrder(userId, req.body);

    return res.status(201).json(result);
  };

  /**
   * ==========================================================
   * 2. Buscar detalhes completos do pedido
   * GET /api/orders/:orderNumber
   * ==========================================================
   */
  getDetails = async (req: AuthRequest, res: Response) => {
    const { orderNumber } = req.params;

    const result = await this.orderService.getOrderDetails(orderNumber);

    return res.status(200).json(result);
  };

  /**
   * ==========================================================
   * 3. ADMIN: Listar todos os pedidos
   * GET /api/admin/orders?status=PAID
   * ==========================================================
   */
  listAll = async (req: Request, res: Response) => {
    const { status } = req.query;

    const result = await this.orderService.listAllOrders(status as string);

    return res.status(200).json(result);
  };

  /**
   * ==========================================================
   * 4. ADMIN: Atualizar status do pedido
   * PATCH /api/admin/orders/:id
   * Body: { "status": "SHIPPED" }
   * ==========================================================
   */
  updateStatus = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { status } = req.body;

    const result = await this.orderService.updateOrderStatus(
      Number(id),
      status
    );

    return res.status(200).json(result);
  };
}
