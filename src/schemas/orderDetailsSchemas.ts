import { z } from "zod";

export const getOrderDetailsParamsSchema = z.object({
  orderNumber: z
    .string()
    .min(1, "orderNumber é obrigatório")
    .max(50, "orderNumber muito longo"),
});

export type GetOrderDetailsParams = z.infer<typeof getOrderDetailsParamsSchema>;
