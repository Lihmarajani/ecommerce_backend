import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      log: ['error', 'warn'],
    });
  }

  async onModuleInit() {
    // Retry logic specifically for Neon/Serverless cold starts
    let retries = 5;
    let connected = false;

    while (retries > 0 && !connected) {
      try {
        await this.$connect();
        this.logger.log('Database connected successfully');
        connected = true;
      } catch (err) {
        retries--;
        this.logger.warn(`DATABASE CONNECTION FAILED. Retrying... (${retries} attempts left)`);
        if (retries === 0) {
          this.logger.error('Could not connect to database after multiple retries', err);
        } else {
          // Wait 2 seconds before the next retry
          await new Promise((resolve) => setTimeout(resolve, 2000));
        }
      }
    }

    if (connected) {
      this.setupShutdownHooks();
    }
  }

  async onModuleDestroy() {
    this.logger.log('Disconnecting from Database...');
    await this.$disconnect();
  }

  private setupShutdownHooks() {
    const closeConnection = async (signal: string) => {
      this.logger.warn(`Received ${signal}. Forcefully disconnecting Prisma...`);
      await this.$disconnect();
      process.exit(0);
    };

    // Catch typical termination signals to prevent dangling connections
    process.once('SIGINT', () => closeConnection('SIGINT'));
    process.once('SIGTERM', () => closeConnection('SIGTERM'));
    process.once('SIGUSR2', () => closeConnection('SIGUSR2')); 
  }
}