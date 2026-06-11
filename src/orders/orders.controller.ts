import {
  Controller,
  Post,
  Get,
  Patch,
  Param,
  Body,
  Req,
  UseGuards,
} from '@nestjs/common';

import { OrdersService } from './orders.service';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

import { OrderStatus, PaymentMethod } from '@prisma/client';

// Define a quick inline interface for incoming Buy Now items
interface CheckoutItemDto {
  productId: string;
  quantity: number;
}

@UseGuards(JwtAuthGuard)
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  // CHECKOUT (CREATE ORDER + AUTO PAYMENT)
  @Post('checkout')
  checkout(
    @Req() req,
    @Body('paymentMethod') paymentMethod: PaymentMethod,
    @Body('totalAmount') totalAmount?: number, // Made optional for backward compatibility
    @Body('items') items?: CheckoutItemDto[],  // Passed from Flutter for 'Buy Now'
  ) {
    // Pass the user ID, payment details, and raw items down to the service layer
    return this.ordersService.checkout(
      req.user.id,
      paymentMethod,
      totalAmount,
      items,
    );
  }

  // GET MY ORDERS
  @Get('my-orders')
  myOrders(@Req() req) {
    return this.ordersService.myOrders(req.user.id);
  }

  // VENDOR ONLY - Get orders for products specifically belonging to the logged-in vendor
  @UseGuards(RolesGuard)
  @Roles('VENDOR')
  @Get('vendor/all')
  async findVendorOrders(@Req() req) {
    // Passes down req.user.id from the verified JWT payload to filter database items
    return this.ordersService.findOrdersByVendor(req.user.id);
  }

  // GET SINGLE ORDER
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.ordersService.findOne(id);
  }

  // ADMIN / VENDOR: UPDATE ORDER STATUS
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'VENDOR')
  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body('status') status: OrderStatus,
  ) {
    return this.ordersService.updateStatus(id, status);
  }

  // ADMIN / VENDOR: GET ALL ORDERS
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'VENDOR')
  @Get('admin/all')
  getAllOrders() {
    return this.ordersService.getAllOrders();
  }
}