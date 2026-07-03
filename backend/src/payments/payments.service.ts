import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import Stripe from 'stripe';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCheckoutSessionDto } from './schemas/payment.schema';

@Injectable()
export class PaymentsService {
  private readonly stripe: Stripe;
  private readonly logger = new Logger(PaymentsService.name);

  constructor(private readonly prisma: PrismaService) {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2024-06-20',
    });
  }

  async createCheckoutSession(dto: CreateCheckoutSessionDto, userId: string): Promise<{ url: string }> {
    const booking = await this.prisma.booking.findUnique({
      where: { id: dto.bookingId },
      include: { service: true, client: true, payment: true },
    });

    if (!booking) throw new NotFoundException('Booking not found');
    if (booking.clientId !== userId) throw new BadRequestException('Unauthorized');
    if (booking.payment) throw new BadRequestException('Payment already exists');

    const amountInCents = Math.round(Number(booking.service.price) * 100);

    const session = await this.stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      customer_email: booking.client.email,
      line_items: [
        {
          price_data: {
            currency: booking.service.currency.toLowerCase(),
            product_data: {
              name: booking.service.name,
              description: `Réservation du ${booking.startAt.toLocaleDateString('fr-FR')} à ${booking.startAt.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`,
            },
            unit_amount: amountInCents,
          },
          quantity: 1,
        },
      ],
      success_url: `${process.env.FRONTEND_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/booking/${dto.bookingId}`,
      metadata: { bookingId: dto.bookingId },
    });

    await this.prisma.payment.create({
      data: {
        bookingId: dto.bookingId,
        stripeSessionId: session.id,
        amount: booking.service.price,
        currency: booking.service.currency,
        status: 'PENDING',
      },
    });

    return { url: session.url! };
  }

  async handleWebhook(rawBody: Buffer, signature: string): Promise<void> {
    let event: Stripe.Event;

    try {
      event = this.stripe.webhooks.constructEvent(
        rawBody,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET!,
      );
    } catch (err) {
      this.logger.error('Webhook signature verification failed', err);
      throw new BadRequestException('Invalid webhook signature');
    }

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await this.handleCheckoutCompleted(session);
        break;
      }
      case 'checkout.session.expired': {
        const session = event.data.object as Stripe.Checkout.Session;
        await this.handleCheckoutExpired(session);
        break;
      }
      default:
        this.logger.log(`Unhandled event type: ${event.type}`);
    }
  }

  private async handleCheckoutCompleted(session: Stripe.Checkout.Session): Promise<void> {
    const bookingId = session.metadata?.bookingId;
    if (!bookingId) return;

    await this.prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: { stripeSessionId: session.id },
        data: {
          status: 'PAID',
          stripePaymentIntentId: session.payment_intent as string,
          paidAt: new Date(),
        },
      });
      await tx.booking.update({
        where: { id: bookingId },
        data: { status: 'CONFIRMED' },
      });
    });
  }

  private async handleCheckoutExpired(session: Stripe.Checkout.Session): Promise<void> {
    await this.prisma.payment.update({
      where: { stripeSessionId: session.id },
      data: { status: 'FAILED' },
    });
  }

  async getPaymentByBooking(bookingId: string) {
    return this.prisma.payment.findUnique({ where: { bookingId } });
  }
}
