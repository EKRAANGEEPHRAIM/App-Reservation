import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateServiceDto, UpdateServiceDto } from './schemas/service.schema';

@Injectable()
export class ServicesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(providerId: string, dto: CreateServiceDto) {
    return this.prisma.service.create({
      data: { providerId, ...dto },
    });
  }

  async findByProvider(providerId: string) {
    return this.prisma.service.findMany({
      where: { providerId, isActive: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string) {
    const service = await this.prisma.service.findUnique({ where: { id } });
    if (!service) throw new NotFoundException('Service not found');
    return service;
  }

  async update(id: string, providerId: string, dto: UpdateServiceDto) {
    const service = await this.findById(id);
    if (service.providerId !== providerId) throw new ForbiddenException();
    return this.prisma.service.update({ where: { id }, data: dto });
  }

  async remove(id: string, providerId: string) {
    const service = await this.findById(id);
    if (service.providerId !== providerId) throw new ForbiddenException();
    return this.prisma.service.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
