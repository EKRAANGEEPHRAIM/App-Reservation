import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserDto, CreateProviderDto } from './schemas/user.schema';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        avatarUrl: true,
        role: true,
        createdAt: true,
        provider: true,
      },
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async update(id: string, dto: UpdateUserDto) {
    return this.prisma.user.update({
      where: { id },
      data: dto,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        avatarUrl: true,
        role: true,
      },
    });
  }

  async createProvider(userId: string, dto: CreateProviderDto) {
    return this.prisma.provider.create({
      data: { userId, ...dto },
    });
  }

  async findAllProviders(category?: string) {
    return this.prisma.provider.findMany({
      where: {
        isActive: true,
        ...(category && { category: category as never }),
      },
      include: {
        user: {
          select: { firstName: true, lastName: true, avatarUrl: true, email: true },
        },
        services: { where: { isActive: true } },
      },
    });
  }
}
