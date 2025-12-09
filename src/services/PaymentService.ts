// src/services/PaymentService.ts

import { MercadoPagoConfig, Preference } from "mercadopago";
import env from "../config/env";
import { Order, OrderItem, PayerData } from "../entities/Order"; // Assumindo que você usa estas entidades

// Tipos de Resposta Simplificados para o Controller
interface PreferenceResponse {
    preferenceId: string;
    initPoint: string;
}

// O serviço de ordem precisa ser injetado para atualizar o campo mercadoPagoPreferenceId
interface IOrderService {
    updateMercadoPagoPreference(orderId: number, preferenceId: string): Promise<void>;
    // Se você tiver outros métodos de acesso a pedidos que precisarem ser chamados
}

export class PaymentService {
    private client: MercadoPagoConfig;

    // Assumindo que a injeção do OrderService é necessária para salvar a preferenceId
    constructor(private orderService: IOrderService) {
        // Inicializa o cliente do Mercado Pago usando a variável de ambiente
        this.client = new MercadoPagoConfig({ 
            accessToken: env.MP_ACCESS_TOKEN, // MP_ACCESS_TOKEN deve estar no .env
            options: { timeout: 5000 } // Timeout opcional
        });
    }

    /**
     * Cria uma preferência de pagamento no Mercado Pago.
     * @param order - Dados básicos do pedido.
     * @param items - Lista de itens do pedido.
     * @param payer - Dados do pagador.
     * @returns Um objeto contendo o ID da preferência e a URL de redirecionamento (initPoint).
     */
    async createMercadoPagoPreference(
        order: Order,
        items: OrderItem[],
        payer: PayerData
    ): Promise<PreferenceResponse> {
        
        // Mapeamento dos itens do seu domínio para o formato do Mercado Pago
        const mpItems = items.map(item => ({
            title: item.product_name_snapshot,
            unit_price: Number(item.unit_price), // Deve ser um número
            quantity: item.quantity,
            currency_id: "BRL", // Ajuste para sua moeda (ex: BRL, ARS, etc.)
        }));

        // Payload da preferência com as correções críticas (P0)
        const preferencePayload: PreferenceRequest = {
            items: mpItems,
            payer: {
                // Adaptação simples de PayerData para o formato MP
                name: payer.fullName.split(' ')[0],
                surname: payer.fullName.split(' ').slice(1).join(' '),
                email: payer.email,
                phone: {
                    area_code: payer.phone.slice(0, 2),
                    number: payer.phone.slice(2),
                },
                identification: {
                    type: "CPF", 
                    number: payer.document,
                },
            },
            
            // >> CORREÇÕES CRÍTICAS (P0) AQUI <<
            back_urls: {
                // As URLs de retorno para o frontend após a conclusão do pagamento
                success: `${env.APP_URL}/payment/success/${order.order_number}`, 
                failure: `${env.APP_URL}/payment/failure/${order.order_number}`,
                pending: `${env.APP_URL}/payment/pending/${order.order_number}`,
            },
            auto_return: "approved", // Redireciona automaticamente o cliente em caso de pagamento aprovado
            
            // URL de Notificação para o Webhook (backend)
            notification_url: `${env.APP_URL}/api/mercadopago/webhook`, // Endpoint configurado com express.raw()
            
            external_reference: order.order_number, // Referência do seu pedido
            // ... outras configurações como shipment, taxes, etc.
        };

        // Cria a preferência usando a SDK
        const preference = await new Preference(this.client).create({ body: preferencePayload });

        // Salva a preferenceId no banco de dados local (OrderService ou Repository)
        await this.orderService.updateMercadoPagoPreference(order.id, preference.id);
        
        return {
            preferenceId: preference.id,
            initPoint: preference.init_point, // URL para redirecionar o cliente
        };
    }

    // Este método é apenas para buscar o status real na API MP, chamado pelo WebhookService (P1)
    async getPaymentStatus(paymentId: string): Promise<string> {
        try {
            // Usa o cliente configurado para fazer a requisição GET
            const paymentClient = new Payment(this.client);
            const response = await paymentClient.get({ id: paymentId });

            return response.status; // Retorna o status do pagamento (approved, rejected, etc.)
        } catch (error) {
            console.error("Error fetching payment status from Mercado Pago:", error);
            // Propagar erro ou retornar um status de erro
            throw new AppError("Failed to fetch payment status from external provider.", 500);
        }
    }
}