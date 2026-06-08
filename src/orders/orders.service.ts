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

// Define the shape of incoming dynamic Buy Now items
interface CheckoutItemDto {
  productId: string;
  quantity: number;
}

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) {}

  // CHECKOUT (WITH DUAL CART & BUY NOW AUTO PAYMENT CREATION)
  async checkout(
    userId: string,
    paymentMethod: any = PaymentMethod.COD,
    totalAmount?: number,               // Dynamic field from Flutter
    directItems?: CheckoutItemDto[],    // Dynamic field from Flutter for Buy Now
  ) {
    let safePaymentMethod: PaymentMethod = PaymentMethod.COD; 
    
    if (paymentMethod === 'Cash on Delivery' || paymentMethod === 'COD') {
      safePaymentMethod = PaymentMethod.COD;
    } else if (paymentMethod === 'GCash' || paymentMethod === 'GCASH') {
      safePaymentMethod = PaymentMethod.GCASH;
    }

    return this.prisma.$transaction(
      async (tx) => {
        let normalizedItems: Array<{ productId: string; quantity: number; price: number; productName: string }> = [];
        const isBuyNowFlow = directItems && directItems.length > 0;

        if (isBuyNowFlow) {
          // --- BRANCH A: BUY NOW FLOW ---
          for (const item of directItems) {
            const dbProduct = await tx.product.findUnique({
              where: { id: item.productId },
            });

            if (!dbProduct) {
              throw new NotFoundException(`Product with ID ${item.productId} no longer exists`);
            }

            if (item.quantity > dbProduct.stock) {
              throw new BadRequestException(`${dbProduct.name} is out of stock`);
            }

            normalizedItems.push({
              productId: item.productId,
              quantity: item.quantity,
              price: dbProduct.price,
              productName: dbProduct.name,
            });
          }
        } else {
          // --- BRANCH B: STANDARD CART FLOW ---
          const cartItems = await tx.cartItem.findMany({
            where: { userId },
            include: { product: true },
          });

          if (cartItems.length === 0) {
            throw new BadRequestException('Cart is empty');
          }

          for (const item of cartItems) {
            if (item.quantity > item.product.stock) {
              throw new BadRequestException(`${item.product.name} is out of stock`);
            }

            normalizedItems.push({
              productId: item.productId,
              quantity: item.quantity,
              price: item.product.price,
              productName: item.product.name,
            });
          }
        }

        // Calculate total amount securely using backend system configurations
        const total = normalizedItems.reduce((acc, current) => acc + (current.price * current.quantity), 0);

        // CREATE ORDER
        const order = await tx.order.create({
          data: {
            userId,
            total,
            status: OrderStatus.PENDING,
            items: {
              create: normalizedItems.map((item) => ({
                productId: item.productId,
                quantity: item.quantity,
                price: item.price,
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
            method: safePaymentMethod,
            amount: total,
            status: PaymentStatus.PENDING,
          },
        });

        // DECREMENT STOCK FOR ALL ITEMS PROCESSED
        for (const item of normalizedItems) {
          await tx.product.update({
            where: { id: item.productId },
            data: {
              stock: {
                decrement: item.quantity,
              },
            },
          });
        }

        // CLEAR CART ONLY IF IT WAS A STANDARD CART CHECKOUT
        if (!isBuyNowFlow) {
          await tx.cartItem.deleteMany({
            where: { userId },
          });
        }

        return {
          order,
          payment,
        };
      },
      {
        maxWait: 5000, 
        timeout: 20000, 
      }
    );
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

  // UPDATE ORDER STATUS (ADMIN / VENDOR)
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