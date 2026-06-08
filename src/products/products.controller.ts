import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  Query,
  UseGuards,
  Request,
  UseInterceptors, 
  UploadedFile,    
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express'; 

import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  // PUBLIC - Get all products (with search + filters)
  @Get()
  findAll(
    @Query('page') page = '1',
    @Query('limit') limit = '10',
    @Query('search') search?: string,
    @Query('minPrice') minPrice?: string,
    @Query('maxPrice') maxPrice?: string,
    @Query('inStock') inStock?: string,
  ) {
    return this.productsService.findAll({
      page: Number(page),
      limit: Number(limit),
      search,
      minPrice,
      maxPrice,
      inStock,
    });
  }

  // PUBLIC - Get single product
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  // VENDOR ONLY - Create product
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('VENDOR')
  @Post()
  @UseInterceptors(FileInterceptor('file')) 
  async create( 
    @Body() body: any, 
    @UploadedFile() file: any, 
    @Request() req: any
  ) {
    const vendorId = req.user.id; 

    // 1. Send the file to Cloudinary and get the public URL back!
    let uploadedImageUrl = '';
    if (file) {
      uploadedImageUrl = await this.productsService.uploadImage(file);
    }

    // 2. Package the text data AND the new image URL together
    const dto = {
      name: body.name,
      description: body.description,
      price: parseFloat(body.price),
      stock: parseInt(body.stock, 10),
      imageUrl: uploadedImageUrl, 
    } as CreateProductDto;

    // 3. Save everything to the database
    return this.productsService.create(dto, vendorId);
  }

  // VENDOR ONLY - Update product
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('VENDOR')
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    return this.productsService.update(id, dto);
  }

  // VENDOR ONLY - Delete product
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('VENDOR')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.productsService.remove(id);
  }

  // ==========================================
  // ---> NEW: REVIEW ENDPOINT <---
  // ==========================================
  // REGISTERED USERS ONLY - Add a review
  @UseGuards(JwtAuthGuard) 
  @Post(':id/reviews')
  async addReview(
    @Param('id') productId: string,
    @Body() body: { rating: number; comment: string },
    @Request() req
  ) {
    // req.user.id comes automatically from the logged-in JWT token
    return this.productsService.addReview(
      productId,
      req.user.id,
      body.rating,
      body.comment
    );
  }
}