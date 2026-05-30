import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { IntegrationService } from './integration.service';
import { ApiKeyGuard } from '../auth/guards/api-key.guard';

@UseGuards(ApiKeyGuard)
@Controller('integration')
export class IntegrationController {
  constructor(private readonly service: IntegrationService) {}

  // external apps fetch products
  @Get('products')
  getProducts() {
    return this.service.getProducts();
  }

  // external apps create order
  @Post('order')
  createOrder(@Body() body: any) {
    return this.service.createExternalOrder(body);
  }
}