import { Request, Response } from "express";
import { PaymentService } from "../services/PaymentService";
// Você precisará instanciar o PaymentService aqui com os repositórios reais
// Como isso pode ser complexo sem injeção de dependência automática, 
// vou assumir que você tem uma instância exportada ou criará aqui.
import { OrderRepository } from "../repositories/mysql/OrderRepository"; // Exemplo
import { ProductRepository } from "../repositories/mysql/ProductRepository"; // Exemplo

// Instanciando repositórios e serviço manualmente (ajuste os caminhos conforme sua estrutura)
const orderRepository = new OrderRepository();
const productRepository = new ProductRepository();
const paymentService = new PaymentService(orderRepository, productRepository);

export async function mercadoPagoWebhook(req: Request, res: Response) {
  try {
    // O ID do pagamento geralmente vem em req.body.data.id ou req.query['data.id']
    const paymentId = req.body?.data?.id || req.query['data.id'] || req.body?.id;
    const type = req.body?.type || req.body?.topic; // payment

    if (type === "payment" && paymentId) {
       await paymentService.handleMercadoPagoWebhook(String(paymentId));
    }

    // SEMPRE retorne 200 para o Mercado Pago, senão eles reenviam a notificação
    return res.status(200).json({ received: true });

  } catch (error) {
    console.error("Webhook error:", error);
    // Mesmo com erro interno, retornamos 200 ou 500? 
    // Se retornar 500, o MP tenta de novo. Se for erro de código, melhor 200 para parar o loop.
    return res.status(500).json({ error: "Server error" });
  }
}