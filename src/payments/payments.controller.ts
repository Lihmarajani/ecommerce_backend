import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  Headers,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';

import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@UseGuards(JwtAuthGuard)
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  // 💳 USER: SIMULATE GCASH PAYMENT
  @Post(':id/pay')
  pay(@Param('id') id: string) {
    return this.paymentsService.payNow(id);
  }

  // 📦 USER: GET PAYMENT DETAILS
  @Get(':id')
  getPayment(@Param('id') id: string) {
    return this.paymentsService.findPayment(id);
  }

  // 🚚 ADMIN: CONFIRM COD PAYMENT
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @Post(':id/confirm-cod')
  confirmCOD(@Param('id') id: string) {
    return this.paymentsService.confirmCOD(id);
  }

  // 🔔 WEBHOOK: AUTO PAYMENT CONFIRMATION (GCASH / EXTERNAL APPS)
  @Post('webhook')
  handleWebhook(
    @Body() payload: any,
    @Headers('x-webhook-secret') secret: string,
  ) {
    if (!secret) {
      throw new BadRequestException('Missing webhook secret');
    }

    return this.paymentsService.handleWebhook(payload, secret);
  }
}