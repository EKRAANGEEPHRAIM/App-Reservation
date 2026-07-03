import { z } from 'zod';

export const CreateServiceSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  durationMin: z.number().int().min(5),
  price: z.number().positive(),
  currency: z.string().length(3).default('EUR'),
});

export const UpdateServiceSchema = CreateServiceSchema.partial();

export type CreateServiceDto = z.infer<typeof CreateServiceSchema>;
export type UpdateServiceDto = z.infer<typeof UpdateServiceSchema>;
