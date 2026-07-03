import { z } from 'zod';

export const CreateBookingSchema = z.object({
  providerId: z.string().cuid(),
  serviceId: z.string().cuid(),
  startAt: z.string().datetime(),
  notes: z.string().optional(),
});

export const UpdateBookingStatusSchema = z.object({
  status: z.enum(['CONFIRMED', 'CANCELLED', 'COMPLETED', 'NO_SHOW']),
  cancelReason: z.string().optional(),
});

export type CreateBookingDto = z.infer<typeof CreateBookingSchema>;
export type UpdateBookingStatusDto = z.infer<typeof UpdateBookingStatusSchema>;
