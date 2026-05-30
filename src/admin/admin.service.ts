import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  // TOTAL STATS
  async getStats() {
    const totalOrders = await this.prisma.order.count();

    const totalProducts = await this.prisma.product.count();

    const totalUsers = await this.prisma.user.count();

    const totalRevenue = await this.prisma.order.aggregate({
      _sum: {
        total: true,
      },
    });

    return {
      totalOrders,
      totalProducts,
      totalUsers,
      totalRevenue: totalRevenue._sum.total || 0,
    };
  }

  // LOW STOCK PRODUCTS
  async lowStockProducts() {
    return this.prisma.product.findMany({
      where: {
        stock: {
          lte: 5,
        },
      },

      orderBy: {
        stock: 'asc',
      },
    });
  }

  // ALL ORDERS
  async allOrders() {
    return this.prisma.order.findMany({
      include: {
        user: true,
        payment: true,

        items: {
          include: {
            product: true,
          },
        },
      },

      orderBy: {
        createdAt: 'desc',
      },
    });
  }
}