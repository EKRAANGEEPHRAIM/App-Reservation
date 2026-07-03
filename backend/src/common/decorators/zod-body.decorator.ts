import { Body, UsePipes } from '@nestjs/common';
import { ZodSchema } from 'zod';
import { ZodValidationPipe } from '../pipes/zod-validation.pipe';

export const ZodBody = (schema: ZodSchema): ParameterDecorator =>
  Body(new ZodValidationPipe(schema));
