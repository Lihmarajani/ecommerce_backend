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
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'; // Adjust if your path is different

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

    // FIXED: Changed req.user.userId to req.user.id
    return this.cartService.addToCart(
      req.user.id, 
      dto.productId,
      dto.quantity,
    );
  }

  // GET USER CART
  @Get()
  getCart(@Req() req) {
    // FIXED: Changed req.user.userId to req.user.id
    return this.cartService.getCart(req.user.id);
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