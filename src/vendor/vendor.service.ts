import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class VendorService {
  constructor(private prisma: PrismaService) {}

  async getDashboardStats(vendorId: string) {
    // 1. Total Active Products (using vendorId from your schema)
    const totalProducts = await this.prisma.product.count({
      where: { vendorId: vendorId }, 
    });

    // 2. Low Stock Count
    const lowStockCount = await this.prisma.product.count({
      where: { 
        vendorId: vendorId,
        stock: { lt: 10 }
      },
    });

    // 3. Total Orders & Revenue
    // Find all OrderItems linked to products owned by this specific vendor
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

    // Calculate total orders by counting unique order IDs
    const uniqueOrderIds = new Set(vendorOrderItems.map(item => item.orderId));
    const totalOrders = uniqueOrderIds.size;
    
    // Calculate total revenue by summing (price * quantity) of the vendor's items
    const totalRevenue = vendorOrderItems.reduce(
      (sum, item) => sum + (item.price * item.quantity), 
      0
    );

    return {
      totalRevenue: totalRevenue.toFixed(2), 
      totalOrders,
      totalProducts,
      lowStockCount,
    };
  }

  // --- HELPER METHOD FOR FLUTTER INVENTORY SCREEN ---
  async getMyProducts(vendorId: string) {
    return this.prisma.product.findMany({
      where: { vendorId: vendorId }, // Updated to match schema
      orderBy: { createdAt: 'desc' },
    });
  }
}