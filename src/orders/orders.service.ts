import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

import {
  Prisma,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
} from '@prisma/client';

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) {}

  // CHECKOUT (WITH AUTO PAYMENT CREATION)
  async checkout(
    userId: string,
    paymentMethod: PaymentMethod = PaymentMethod.COD,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const cartItems = await tx.cartItem.findMany({
        where: { userId },
        include: {
          product: true,
        },
      });

      if (cartItems.length === 0) {
        throw new BadRequestException('Cart is empty');
      }

      let total = 0;

      // validate stock + compute total
      for (const item of cartItems) {
        if (item.quantity > item.product.stock) {
          throw new BadRequestException(
            `${item.product.name} is out of stock`,
          );
        }

        total += item.product.price * item.quantity;
      }

      // CREATE ORDER
      const order = await tx.order.create({
        data: {
          userId,
          total,
          status: OrderStatus.PENDING,
          items: {
            create: cartItems.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              price: item.product.price,
            })),
          },
        },
        include: {
          items: true,
        },
      });

      // CREATE PAYMENT
      const payment = await tx.payment.create({
        data: {
          orderId: order.id,
          method: paymentMethod,
          amount: total,
          status: PaymentStatus.PENDING,
        },
      });

      // DECREMENT STOCK
      for (const item of cartItems) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              decrement: item.quantity,
            },
          },
        });
      }

      // CLEAR CART
      await tx.cartItem.deleteMany({
        where: { userId },
      });

      return {
        order,
        payment,
      };
    });
  }

  // GET USER ORDERS
  async myOrders(userId: string) {
    return this.prisma.order.findMany({
      where: { userId },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        payment: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  // GET SINGLE ORDER
  async findOne(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        payment: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return order;
  }

  // UPDATE ORDER STATUS (ADMIN)
  async updateStatus(orderId: string, status: OrderStatus) {
    return this.prisma.order.update({
      where: { id: orderId },
      data: { status },
    });
  }

  // GET ALL ORDERS (ADMIN DASHBOARD)
  async getAllOrders() {
    return this.prisma.order.findMany({
      include: {
        user: true,
        items: {
          include: {
            product: true,
          },
        },
        payment: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }
}