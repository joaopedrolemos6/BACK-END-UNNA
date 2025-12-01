import { Request, Response } from "express";
import { PaymentService } from "../services/PaymentService";
import { OrderRepository } from "../repositories/mysql/OrderRepository";
import { ProductRepository } from "../repositories/mysql/ProductRepository"; // Import novo

class MercadoPagoController {
  private orderRepository = new OrderRepository();
  private productRepository = new ProductRepository(); // Instância nova
  
  // Injeção das duas dependências
  private paymentService = new PaymentService(
    this.orderRepository, 
    this.productRepository
  );

  handleWebhook = async (req: Request, res: Response) => {
    try {
      const { type, data } = req.body;
      const topic = type || req.body.action;
      const id = data?.id || req.body.data?.id;

      console.log(`🔔 Webhook recebido: Tópico [${topic}] - ID [${id}]`);

      if (topic === "payment" && id) {
        await this.paymentService.handleMercadoPagoWebhook(id);
        return res.status(200).json({ success: true });
      }

      return res.status(200).json({ message: "Event ignored" });
    } catch (error: any) {
      console.error(`❌ Erro no Webhook: ${error.message}`);
      return res.status(500).json({ error: error.message });
    }
  };
}

export const mercadoPagoController = new MercadoPagoController();