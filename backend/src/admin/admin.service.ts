import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboardStats() {
    const [totalUsers, totalBookings, totalRevenue, recentBookings] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.booking.count(),
      this.prisma.payment.aggregate({
        _sum: { amount: true },
        where: { status: 'PAID' },
      }),
      this.prisma.booking.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          client: { select: { firstName: true, lastName: true, email: true } },
          service: { select: { name: true, price: true } },
          provider: { include: { user: { select: { firstName: true, lastName: true } } } },
          payment: true,
        },
      }),
    ]);

    return {
      totalUsers,
      totalBookings,
      totalRevenue: totalRevenue._sum.amount ?? 0,
      recentBookings,
    };
  }

  async getAllBookings(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [bookings, total] = await Promise.all([
      this.prisma.booking.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          client: { select: { firstName: true, lastName: true, email: true } },
          service: { select: { name: true, price: true, currency: true } },
          provider: { include: { user: { select: { firstName: true, lastName: true } } } },
          payment: true,
        },
      }),
      this.prisma.booking.count(),
    ]);

    return { bookings, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getAllUsers(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          createdAt: true,
          provider: { select: { category: true, isActive: true } },
        },
      }),
      this.prisma.user.count(),
    ]);

    return { users, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getRevenueStats() {
    const payments = await this.prisma.payment.findMany({
      where: { status: 'PAID' },
      select: { amount: true, currency: true, paidAt: true },
      orderBy: { paidAt: 'asc' },
    });

    return payments;
  }
}
