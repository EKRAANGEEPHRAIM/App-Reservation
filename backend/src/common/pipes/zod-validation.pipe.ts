import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';
import { ZodSchema, ZodError } from 'zod';

@Injectable()
export class ZodValidationPipe implements PipeTransform {
  constructor(private readonly schema: ZodSchema) {}

  transform(value: unknown): unknown {
    // safeParse returns a result object with success boolean and data/error properties
    const result = this.schema.safeParse(value);
    if (!result.success) {
      throw new BadRequestException({
        message: 'Validation failed',
        // flatten converts the error object to a more readable format
        errors: (result.error as ZodError).flatten().fieldErrors ,
      });
    }
    return result.data;
  }
}
