import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { VendorService } from './vendor.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

// Secures the entire controller
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('VENDOR') // Ensures only users with the VENDOR role can access these routes
@Controller('vendor')
export class VendorController {
  constructor(private readonly vendorService: VendorService) {}

  @Get('stats')
  getStats(@Req() req) {
    // Using req.user.id just like we fixed in the Cart and Order controllers!
    return this.vendorService.getDashboardStats(req.user.id);
  }

  @Get('products')
  getMyProducts(@Req() req) {
    return this.vendorService.getMyProducts(req.user.id);
  }
}