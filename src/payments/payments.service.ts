import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { PaymentStatus, OrderStatus } from '@prisma/client';

@Injectable()
export class PaymentsService {
  constructor(private prisma: PrismaService) {}

  //PAY NOW (GCASH SIMULATION / ONLINE PAYMENT)
  async payNow(paymentId: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: { order: true },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    // ❗ prevent double payment
    if (payment.status === PaymentStatus.PAID) {
      throw new BadRequestException('Payment already completed');
    }

    // ❗ prevent invalid order state
    if (payment.order.status === OrderStatus.CANCELLED) {
      throw new BadRequestException('Cannot pay for cancelled order');
    }

    const updatedPayment = await this.prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: PaymentStatus.PAID,
      },
    });

    await this.prisma.order.update({
      where: { id: payment.orderId },
      data: {
        status: OrderStatus.PAID,
      },
    });

    return updatedPayment;
  }

  //GET PAYMENT DETAILS
  async findPayment(id: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id },
      include: {
        order: {
          include: {
            items: {
              include: {
                product: true,
              },
            },
          },
        },
      },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    return payment;
  }

  //COD CONFIRMATION (ADMIN USE)
  async confirmCOD(paymentId: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: { order: true },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    if (payment.status === PaymentStatus.PAID) {
      throw new BadRequestException('Already confirmed');
    }

    const updatedPayment = await this.prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: PaymentStatus.PAID,
      },
    });

    await this.prisma.order.update({
      where: { id: payment.orderId },
      data: {
        status: OrderStatus.DELIVERED,
      },
    });

    return updatedPayment;
  }

  //WEBHOOK: AUTO PAYMENT CONFIRMATION (GCASH / EXTERNAL APPS)
  async handleWebhook(payload: any, secret: string) {
    // simple security check
    if (secret !== process.env.INTEGRATION_API_KEY) {
      throw new BadRequestException('Invalid webhook secret');
    }

    const { paymentId, status } = payload;

    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: { order: true },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    // prevent duplicate processing
    if (payment.status === PaymentStatus.PAID) {
      return { message: 'Already processed' };
    }

    const updatedPayment = await this.prisma.payment.update({
      where: { id: paymentId },
      data: {
        status:
          status === 'PAID'
            ? PaymentStatus.PAID
            : PaymentStatus.FAILED,
      },
    });

    await this.prisma.order.update({
      where: { id: payment.orderId },
      data: {
        status:
          status === 'PAID'
            ? OrderStatus.PAID
            : OrderStatus.CANCELLED,
      },
    });

    return {
      message: 'Webhook processed successfully',
      payment: updatedPayment,
    };
  }
}