import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAvailabilityDto, UpdateAvailabilityDto, CreateExceptionDto } from './schemas/availability.schema';

@Injectable()
export class AvailabilityService {
  constructor(private readonly prisma: PrismaService) {}

  async create(providerId: string, dto: CreateAvailabilityDto) {
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

  async update(id: string, dto: UpdateAvailabilityDto) {
    const av = await this.prisma.availability.findUnique({ where: { id } });
    if (!av) throw new NotFoundException('Availability not found');
    return this.prisma.availability.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    return this.prisma.availability.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async createException(dto: CreateExceptionDto) {
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

  async getSlotsForDate(providerId: string, date: string) {
    const d = new Date(date);
    const dayNames = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
    const dayOfWeek = dayNames[d.getDay()];

    const availability = await this.prisma.availability.findFirst({
      where: { providerId, dayOfWeek: dayOfWeek as never, isActive: true },
      include: { exceptions: { where: { exceptionDate: d } } },
    });

    if (!availability) return [];
    if (availability.exceptions.some((e) => e.isUnavailable)) return [];

    return { startTime: availability.startTime, endTime: availability.endTime, date };
  }
}
