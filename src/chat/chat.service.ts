import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ChatService {
  constructor(private prisma: PrismaService) {}

  async getOrCreateConversation(productId: string, customerId: string, vendorId: string) {
    return await this.prisma.conversation.upsert({
      where: {
        productId_customerId_vendorId: { productId, customerId, vendorId },
      },
      update: {},
      create: { productId, customerId, vendorId },
      include: { 
        messages: { orderBy: { createdAt: 'asc' } },
        product: true,
        customer: true,
        vendor: true 
      },
    });
  }

  async sendMessage(conversationId: string, senderId: string, content: string) {
    // Use a transaction to make sure the message is created AND the conversation timestamp updates together
    return await this.prisma.$transaction(async (tx) => {
      // 1. Create the message record
      const message = await tx.message.create({
        data: { 
          conversationId, 
          senderId, 
          content 
        },
      });

      // 2. Force update the conversation's updatedAt timestamp
      await tx.conversation.update({
        where: { id: conversationId },
        data: { updatedAt: new Date() },
      });

      return message;
    });
  }

  async getMyConversations(userId: string) {
    return await this.prisma.conversation.findMany({
      where: {
        OR: [
          { customerId: userId },
          { vendorId: userId },
        ],
      },
      include: {
        messages: { 
          orderBy: { createdAt: 'desc' }, 
          take: 1 
        },
        product: true,
        customer: true,
        vendor: true,
      },
      orderBy: { updatedAt: 'desc' },
    });
  }
}