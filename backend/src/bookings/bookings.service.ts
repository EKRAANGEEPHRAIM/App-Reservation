import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBookingDto, UpdateBookingStatusDto } from './schemas/booking.schema';

@Injectable()
export class BookingsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(clientId: string, dto: CreateBookingDto) {
    const service = await this.prisma.service.findUnique({ where: { id: dto.serviceId } });
    if (!service || !service.isActive) throw new NotFoundException('Service not found');

    const startAt = new Date(dto.startAt);
    const endAt = new Date(startAt.getTime() + service.durationMin * 60 * 1000);

    const conflict = await this.prisma.booking.findFirst({
      where: {
        providerId: dto.providerId,
        status: { in: ['PENDING', 'CONFIRMED'] },
        OR: [
          { startAt: { lte: startAt }, endAt: { gt: startAt } },
          { startAt: { lt: endAt }, endAt: { gte: endAt } },
          { startAt: { gte: startAt }, endAt: { lte: endAt } },
        ],
      },
    });

    if (conflict) throw new BadRequestException('Time slot already booked');

    return this.prisma.booking.create({
      data: {
        clientId,
        providerId: dto.providerId,
        serviceId: dto.serviceId,
        startAt,
        endAt,
        notes: dto.notes,
      },
      include: { service: true, provider: { include: { user: { select: { firstName: true, lastName: true } } } } },
    });
  }

  async findByClient(clientId: string) {
    return this.prisma.booking.findMany({
      where: { clientId },
      include: {
        service: true,
        provider: { include: { user: { select: { firstName: true, lastName: true, avatarUrl: true } } } },
        payment: true,
      },
      orderBy: { startAt: 'desc' },
    });
  }

  async findByProvider(providerId: string) {
    return this.prisma.booking.findMany({
      where: { providerId },
      include: {
        service: true,
        client: { select: { firstName: true, lastName: true, email: true, phone: true } },
        payment: true,
      },
      orderBy: { startAt: 'asc' },
    });
  }

  async findById(id: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      include: { service: true, payment: true, client: true, provider: true },
    });
    if (!booking) throw new NotFoundException('Booking not found');
    return booking;
  }

  async updateStatus(id: string, dto: UpdateBookingStatusDto) {
    await this.findById(id);
    return this.prisma.booking.update({
      where: { id },
      data: { status: dto.status, cancelReason: dto.cancelReason },
    });
  }
}
