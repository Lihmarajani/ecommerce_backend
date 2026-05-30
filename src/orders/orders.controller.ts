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

@UseGuards(JwtAuthGuard)
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  // CHECKOUT (CREATE ORDER + AUTO PAYMENT)
  @Post('checkout')
  checkout(
    @Req() req,
    @Body('paymentMethod') paymentMethod: PaymentMethod,
  ) {
    return this.ordersService.checkout(
      req.user.userId,
      paymentMethod,
    );
  }

  // GET MY ORDERS
  @Get('my-orders')
  myOrders(@Req() req) {
    return this.ordersService.myOrders(req.user.userId);
  }

  // GET SINGLE ORDER
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.ordersService.findOne(id);
  }

  // ADMIN: UPDATE ORDER STATUS
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body('status') status: OrderStatus,
  ) {
    return this.ordersService.updateStatus(id, status);
  }

  // ADMIN: GET ALL ORDERS
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @Get('admin/all')
  getAllOrders() {
    return this.ordersService.getAllOrders();
  }
}