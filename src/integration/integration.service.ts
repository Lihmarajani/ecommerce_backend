import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class IntegrationService {
  constructor(private prisma: PrismaService) {}

  // PUBLIC PRODUCTS (for external apps)
  async getProducts() {
    return this.prisma.product.findMany({
      include: {
        category: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  // EXTERNAL ORDER CREATION (LGU / partner apps / Flutter sync)
  async createExternalOrder(body: any) {
    const { userId, items } = body;

    let total = 0;

    // calculate total + validate stock
    for (const item of items) {
      const product = await this.prisma.product.findUnique({
        where: { id: item.productId },
      });

      if (!product) {
        throw new Error(`Product not found: ${item.productId}`);
      }

      if (item.quantity > product.stock) {
        throw new Error(`${product.name} is out of stock`);
      }

      total += product.price * item.quantity;
    }

    // create order
    const order = await this.prisma.order.create({
      data: {
        userId,
        total,
        items: {
          create: items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.price || 0,
          })),
        },
      },
      include: {
        items: true,
      },
    });

    // reduce stock
    for (const item of items) {
      await this.prisma.product.update({
        where: { id: item.productId },
        data: {
          stock: {
            decrement: item.quantity,
          },
        },
      });
    }

    return order;
  }
}