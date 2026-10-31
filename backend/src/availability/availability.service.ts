import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAvailabilityDto, UpdateAvailabilityDto, CreateExceptionDto } from './schemas/availability.schema';

const DAY_NAMES = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'] as const;

/** Pas entre deux heures de début proposées, en minutes */
const SLOT_STEP_MIN = 30;

const toMinutes = (hhmm: string): number => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};

const toHHMM = (minutes: number): string =>
  `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;

@Injectable()
export class AvailabilityService {
  constructor(private readonly prisma: PrismaService) {}

  // Le JWT porte l'id de l'utilisateur : on retrouve sa fiche prestataire
  private async providerIdForUser(userId: string): Promise<string> {
    const provider = await this.prisma.provider.findUnique({ where: { userId } });
    if (!provider) throw new ForbiddenException('Provider profile required');
    return provider.id;
  }

  private async ownedAvailability(id: string, userId: string) {
    const av = await this.prisma.availability.findUnique({ where: { id }, include: { provider: true } });
    if (!av) throw new NotFoundException('Availability not found');
    if (av.provider.userId !== userId) throw new ForbiddenException('Not your availability');
    return av;
  }

  async create(userId: string, dto: CreateAvailabilityDto) {
    const providerId = await this.providerIdForUser(userId);
    return this.prisma.availability.create({
      data: { providerId, ...dto },
    });
  }

  async findByProvider(providerId: string) {
    return this.prisma.availability.findMany({
      where: { providerId, isActive: true },
      include: { exceptions: true },
      orderBy: { dayOfWeek: 'asc' },
    });
  }

  async findMine(userId: string) {
    return this.findByProvider(await this.providerIdForUser(userId));
  }

  async update(id: string, dto: UpdateAvailabilityDto, userId: string) {
    await this.ownedAvailability(id, userId);
    return this.prisma.availability.update({ where: { id }, data: dto });
  }

  async remove(id: string, userId: string) {
    await this.ownedAvailability(id, userId);
    return this.prisma.availability.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async createException(dto: CreateExceptionDto, userId: string) {
    await this.ownedAvailability(dto.availabilityId, userId);
    return this.prisma.availabilityException.create({
      data: {
        availabilityId: dto.availabilityId,
        exceptionDate: new Date(dto.exceptionDate),
        isUnavailable: dto.isUnavailable,
        overrideStart: dto.overrideStart,
        overrideEnd: dto.overrideEnd,
        reason: dto.reason,
      },
    });
  }

  /**
   * Heures de début libres ("HH:MM") pour un service donné, un jour donné.
   * Les heures sont celles du salon : Abidjan est à UTC+0 toute l'année,
   * donc "09:00" correspond à 09:00Z en base.
   */
  async getSlotsForDate(providerId: string, date: string, serviceId: string) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date ?? '')) throw new BadRequestException('date must be YYYY-MM-DD');

    const service = await this.prisma.service.findUnique({ where: { id: serviceId } });
    if (!service || service.providerId !== providerId || !service.isActive) {
      throw new NotFoundException('Service not found');
    }

    const day = new Date(`${date}T00:00:00Z`);
    const nextDay = new Date(day.getTime() + 24 * 60 * 60 * 1000);

    const availabilities = await this.prisma.availability.findMany({
      where: { providerId, dayOfWeek: DAY_NAMES[day.getUTCDay()], isActive: true },
      include: { exceptions: { where: { exceptionDate: day } } },
    });

    const bookings = await this.prisma.booking.findMany({
      where: {
        providerId,
        status: { in: ['PENDING', 'CONFIRMED'] },
        startAt: { lt: nextDay },
        endAt: { gt: day },
      },
      select: { startAt: true, endAt: true },
    });

    const nowMs = Date.now();
    const slots = new Set<string>();

    for (const av of availabilities) {
      const exception = av.exceptions[0];
      if (exception?.isUnavailable) continue;

      const open = toMinutes(exception?.overrideStart ?? av.startTime);
      const close = toMinutes(exception?.overrideEnd ?? av.endTime);

      for (let start = open; start + service.durationMin <= close; start += SLOT_STEP_MIN) {
        const startMs = day.getTime() + start * 60_000;
        const endMs = startMs + service.durationMin * 60_000;
        if (startMs <= nowMs) continue;

        const taken = bookings.some((b) => b.startAt.getTime() < endMs && b.endAt.getTime() > startMs);
        if (!taken) slots.add(toHHMM(start));
      }
    }

    return { date, slots: [...slots].sort() };
  }
}
