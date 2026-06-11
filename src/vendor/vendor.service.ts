import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class VendorService {
  constructor(private prisma: PrismaService) {}

  async getDashboardStats(vendorId: string) {
    // Fetch the vendor profile attributes from the User table first
    const vendorProfile = await this.prisma.user.findUnique({
      where: { id: vendorId },
      select: {
        name: true,
        email: true,
        shopName: true,
        shopAddress: true,
        shopDescription: true,
        avatarUrl: true,
      },
    });

    if (!vendorProfile) {
      throw new NotFoundException('Vendor profile record not found');
    }

    const totalProducts = await this.prisma.product.count({
      where: { vendorId: vendorId }, 
    });

    const lowStockCount = await this.prisma.product.count({
      where: { 
        vendorId: vendorId,
        stock: { lt: 10 }
      },
    });

    const vendorOrderItems = await this.prisma.orderItem.findMany({
      where: { 
        product: {
          vendorId: vendorId
        }
      },
      select: {
        orderId: true,
        price: true,
        quantity: true
      },
    });

    const uniqueOrderIds = new Set(vendorOrderItems.map(item => item.orderId));
    const totalOrders = uniqueOrderIds.size;
    
    const totalRevenue = vendorOrderItems.reduce(
      (sum, item) => sum + (item.price * item.quantity), 
      0
    );

    // Combine profile structure and metrics inside a single response object
    return {
      profile: vendorProfile,
      totalRevenue: totalRevenue.toFixed(2), 
      totalOrders,
      totalProducts,
      lowStockCount,
    };
  }

  async getMyProducts(vendorId: string) {
    return this.prisma.product.findMany({
      where: { vendorId: vendorId }, 
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateProfileData(vendorId: string, updatePayload: {
    shopName?: string;
    shopAddress?: string;
    shopDescription?: string;
    avatarUrl?: string;
  }) {
    const targetVendor = await this.prisma.user.findUnique({
      where: { id: vendorId }
    });

    if (!targetVendor) {
      throw new NotFoundException('Vendor workspace record no longer exists');
    }

    return this.prisma.user.update({
      where: { id: vendorId },
      data: {
        ...(updatePayload.shopName !== undefined && { shopName: updatePayload.shopName }),
        ...(updatePayload.shopAddress !== undefined && { shopAddress: updatePayload.shopAddress }),
        ...(updatePayload.shopDescription !== undefined && { shopDescription: updatePayload.shopDescription }),
        ...(updatePayload.avatarUrl !== undefined && { avatarUrl: updatePayload.avatarUrl }),
      }
    });
  }
}