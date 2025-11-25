  import { z } from 'zod';

  export const orderItemInputSchema = z.object({
    productId: z.number().int().positive(),
    productVariantId: z.number().int().positive().optional().nullable(),
    quantity: z.number().int().min(1)
  });

  export const orderCustomerSchema = z.object({
    fullName: z.string().min(2).max(191),
    email: z.string().email().max(191),
    document: z.string().max(50).optional().nullable(), // CPF/CNPJ
    phone: z.string().max(50)
  });

  export const orderAddressSchema = z.object({
    street: z.string().min(1).max(191),
    number: z.string().min(1).max(50),
    complement: z.string().max(191).optional().nullable(),
    neighborhood: z.string().min(1).max(191),
    city: z.string().min(1).max(191),
    state: z.string().min(1).max(50),
    zipCode: z.string().min(1).max(20),
    country: z.string().min(1).max(100).default('Brasil')
  });

  export const shippingTypeSchema = z.enum(['DELIVERY', 'PICKUP']);

  export const orderShippingInputSchema = z.object({
    type: shippingTypeSchema,
    storeId: z.number().int().positive().optional().nullable(), // se PICKUP
    address: orderAddressSchema.optional().nullable() // se DELIVERY
  });

  export const orderPaymentInputSchema = z.object({
    method: z.literal('MERCADO_PAGO'),
    installments: z.number().int().min(1).max(12).optional()
  });

  export const createOrderSchema = z.object({
    items: z.array(orderItemInputSchema).min(1),
    customer: orderCustomerSchema,
    shipping: orderShippingInputSchema,
    payment: orderPaymentInputSchema
  });
