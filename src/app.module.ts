import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AppController } from './app.controller';
import { AppService } from './app.service';

import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { PrismaModule } from './prisma/prisma.module';
import { ProductsModule } from './products/products.module';
import { CartModule } from './cart/cart.module';
import { OrdersModule } from './orders/orders.module';
import { CategoriesModule } from './categories/categories.module';
import { PaymentsModule } from './payments/payments.module';
import { VendorModule } from './vendor/vendor.module';
import { IntegrationModule } from './integration/integration.module';
import { ChatModule } from './chat/chat.module';

@Module({
  imports: [
    // =========================
    // GLOBAL CONFIG (ENV)
    // =========================
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    // =========================
    // CORE SYSTEM MODULES
    // =========================
    AuthModule,
    UsersModule,
    PrismaModule,

    // =========================
    // E-COMMERCE MODULES
    // =========================
    ProductsModule,
    CartModule,
    OrdersModule,
    CategoriesModule,

    // =========================
    // PAYMENTS MODULE
    // =========================
    PaymentsModule,

    // =========================
    // VENDOR PANEL (RBAC PROTECTED)
    // =========================
    VendorModule,

    // =========================
    // EXTERNAL INTEGRATION API
    // =========================
    IntegrationModule,

    // =========================
    // CHAT
    // =========================
    ChatModule,
  ],

  controllers: [AppController],

  providers: [AppService],
})
export class AppModule {}