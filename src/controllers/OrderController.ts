import { Response } from "express";
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
   * 2. Buscar detalhes completos do pedido (ETAPA 10)
   *
   * Rota: GET /api/orders/:orderNumber
   * Auth: obrigatório (ensureAuthenticated)
   *
   * Retorna:
   *  - order
   *  - items
   *  - shipping
   *  - payments
   *  - timeline
   * ==========================================================
   */
  getDetails = async (req: AuthRequest, res: Response) => {
    const { orderNumber } = req.params;

    const result = await this.orderService.getOrderDetails(orderNumber);

    return res.status(200).json(result);
  };
}
