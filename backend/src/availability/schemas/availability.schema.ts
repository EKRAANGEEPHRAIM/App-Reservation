import { z } from 'zod';

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

export const CreateAvailabilitySchema = z.object({
  dayOfWeek: z.enum(['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY']),
  startTime: z.string().regex(timeRegex, 'Format HH:MM requis'),
  endTime: z.string().regex(timeRegex, 'Format HH:MM requis'),
});

export const UpdateAvailabilitySchema = CreateAvailabilitySchema.partial();

export const CreateExceptionSchema = z.object({
  availabilityId: z.string().cuid(),
  exceptionDate: z.string().datetime(),
  isUnavailable: z.boolean().default(true),
  overrideStart: z.string().regex(timeRegex).optional(),
  overrideEnd: z.string().regex(timeRegex).optional(),
  reason: z.string().optional(),
});

export type CreateAvailabilityDto = z.infer<typeof CreateAvailabilitySchema>;
export type UpdateAvailabilityDto = z.infer<typeof UpdateAvailabilitySchema>;
export type CreateExceptionDto = z.infer<typeof CreateExceptionSchema>;
