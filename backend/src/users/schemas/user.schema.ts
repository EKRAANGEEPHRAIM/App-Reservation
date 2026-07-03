import { z } from 'zod';

export const UpdateUserSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  phone: z.string().optional(),
  avatarUrl: z.string().url().optional(),
});

export const CreateProviderSchema = z.object({
  bio: z.string().optional(),
  category: z.enum(['COACHING', 'BEAUTY', 'MEDICAL', 'OTHER']),
  locationAddress: z.string().optional(),
  locationLat: z.number().optional(),
  locationLng: z.number().optional(),
});

export type UpdateUserDto = z.infer<typeof UpdateUserSchema>;
export type CreateProviderDto = z.infer<typeof CreateProviderSchema>;
