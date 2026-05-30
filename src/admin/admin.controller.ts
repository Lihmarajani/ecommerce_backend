import { Controller, Get, UseGuards } from '@nestjs/common';

import { AdminService } from './admin.service';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // DASHBOARD STATS
  @Get('stats')
  getStats() {
    return this.adminService.getStats();
  }

  // LOW STOCK PRODUCTS
  @Get('products/low-stock')
  lowStockProducts() {
    return this.adminService.lowStockProducts();
  }

  // ALL ORDERS
  @Get('orders')
  allOrders() {
    return this.adminService.allOrders();
  }
}