import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBookingDto, UpdateBookingStatusDto } from './schemas/booking.schema';

interface AuthUser { id: string; role: string }

@Injectable()
export class BookingsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(clientId: string, dto: CreateBookingDto) {
    const service = await this.prisma.service.findUnique({ where: { id: dto.serviceId } });
    if (!service || !service.isActive) throw new NotFoundException('Service not found');

    if (service.providerId !== dto.providerId) throw new BadRequestException('Service does not belong to provider');

    const startAt = new Date(dto.startAt);
    if (startAt.getTime() <= Date.now()) throw new BadRequestException('Time slot is in the past');
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

  // Le JWT porte l'id de l'utilisateur : on retrouve sa fiche prestataire
  async findByProviderUser(userId: string) {
    const provider = await this.prisma.provider.findUnique({ where: { userId } });
    if (!provider) throw new ForbiddenException('Provider profile required');

    return this.prisma.booking.findMany({
      where: { providerId: provider.id },
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
      include: {
        service: true,
        payment: true,
        client: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
        provider: true,
      },
    });
    if (!booking) throw new NotFoundException('Booking not found');
    return booking;
  }

  // Le prestataire de la réservation et l'admin changent tous les statuts ;
  // le client ne peut qu'annuler sa propre réservation.
  async updateStatus(id: string, dto: UpdateBookingStatusDto, user: AuthUser) {
    const booking = await this.findById(id);
    const isOwnerProvider = booking.provider.userId === user.id;
    const isOwnerClient = booking.clientId === user.id;
    const allowed =
      user.role === 'ADMIN' || isOwnerProvider || (isOwnerClient && dto.status === 'CANCELLED');
    if (!allowed) throw new ForbiddenException('Not allowed to change this booking');

    if (['CANCELLED', 'COMPLETED', 'NO_SHOW'].includes(booking.status)) {
      throw new BadRequestException('Booking is already closed');
    }

    return this.prisma.booking.update({
      where: { id },
      data: { status: dto.status, cancelReason: dto.cancelReason },
    });
  }
}
