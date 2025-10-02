import { z } from 'zod';

export const shippingMethodSchema = z.enum(['standard', 'express']);

export const checkoutFormSchema = z.object({
  name: z.string().min(1, '请输入收货人姓名'),
  phone: z
    .string()
    .min(6, '请填写有效联系电话')
    .regex(/^[0-9+\-()\s]+$/, '电话号码格式不正确'),
  email: z.string().email('请输入有效邮箱').optional().or(z.literal('').transform(() => undefined)),
  address: z.string().min(5, '请填写完整收货地址'),
  method: shippingMethodSchema,
  city: z.string().optional(),
  postalCode: z.string().optional(),
  notes: z.string().max(500).optional(),
  agreeToTerms: z
    .boolean()
    .default(false)
    .refine((value) => value, { message: '请阅读并同意服务条款' }),
});

export type CheckoutFormValues = z.infer<typeof checkoutFormSchema>;
