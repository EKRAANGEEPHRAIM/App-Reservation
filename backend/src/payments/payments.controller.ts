import { Controller, Post, Get, Body, Param, Headers, Req, UseGuards, Request, RawBodyRequest } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PaymentsService } from './payments.service';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { CreateCheckoutSessionSchema, CreateCheckoutSessionDto } from './schemas/payment.schema';
import { FastifyRequest } from 'fastify';

interface AuthRequest { user: { id: string } }

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('checkout')
  @UseGuards(AuthGuard('jwt'))
  async createCheckout(
    @Request() req: AuthRequest,
    @Body(new ZodValidationPipe(CreateCheckoutSessionSchema)) dto: CreateCheckoutSessionDto,
  ) {
    return this.paymentsService.createCheckoutSession(dto, req.user.id);
  }

  @Post('webhook')
  async handleWebhook(
    @Req() req: RawBodyRequest<FastifyRequest>,
    @Headers('stripe-signature') signature: string,
  ) {
    await this.paymentsService.handleWebhook(req.rawBody as Buffer, signature);
    return { received: true };
  }

  @Get('booking/:bookingId')
  @UseGuards(AuthGuard('jwt'))
  async getByBooking(@Param('bookingId') bookingId: string) {
    return this.paymentsService.getPaymentByBooking(bookingId);
  }
}
