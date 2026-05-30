import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  Req,
  UseGuards,
} from '@nestjs/common';

import { CartService } from './cart.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

import { AddToCartDto } from './dto/add-to-cart.dto';
import { UpdateCartDto } from './dto/update-cart.dto';

@UseGuards(JwtAuthGuard)
@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  // ADD TO CART
  @Post('add')
  addToCart(@Req() req, @Body() dto: AddToCartDto) {
    console.log('REQ USER:', req.user);

    return this.cartService.addToCart(
      req.user.userId,
      dto.productId,
      dto.quantity,
    );
  }

  // GET USER CART
  @Get()
  getCart(@Req() req) {
    return this.cartService.getCart(req.user.userId);
  }

  // UPDATE CART ITEM QUANTITY
  @Patch(':id')
  updateCartItem(@Param('id') id: string, @Body() dto: UpdateCartDto) {
    return this.cartService.updateCartItem(id, dto.quantity);
  }

  // REMOVE ITEM FROM CART
  @Delete(':id')
  removeCartItem(@Param('id') id: string) {
    return this.cartService.removeCartItem(id);
  }
}