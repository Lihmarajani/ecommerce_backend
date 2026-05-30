import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  // Initialize the professional NestJS logger for this service
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      log: ['error', 'warn'],
    });
  }

  async onModuleInit() {
    await this.$connect();
    // Log a success message once the connection is established
    this.logger.log('Successfully connected to the database.');
  }

  async onModuleDestroy() {
    await this.$disconnect();
    // Log a message when the connection is safely closed
    this.logger.log('Database connection closed.');
  }
}