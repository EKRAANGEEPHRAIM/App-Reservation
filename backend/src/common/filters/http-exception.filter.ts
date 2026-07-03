import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { FastifyReply } from 'fastify';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const reply = ctx.getResponse<FastifyReply>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let errors: unknown = undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const response = exception.getResponse();
      if (typeof response === 'object' && response !== null) {
        const r = response as Record<string, unknown>;
        message = (r['message'] as string) ?? message;
        errors = r['errors'];
      } else {
        message = response as string;
      }
    } else {
      this.logger.error('Unhandled exception', exception);
    }

    void reply.status(status).send({
      statusCode: status,
      message,
      ...(errors !== undefined && { errors }),
      timestamp: new Date().toISOString(),
    });
  }
}
