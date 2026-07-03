import { z } from 'zod';

export const CreateCheckoutSessionSchema = z.object({
  bookingId: z.string().cuid(),
});

export const StripeWebhookSchema = z.object({
  type: z.string(),
  data: z.object({
    object: z.record(z.unknown()),
  }),
});

export type CreateCheckoutSessionDto = z.infer<typeof CreateCheckoutSessionSchema>;
