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

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

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

    // Robust multi-tier extraction to capture imageUrl across varied payload formats
    let finalImageUrl = '';
    
    if (body.imageUrl) {
      finalImageUrl = body.imageUrl;
    } else if (body.data && typeof body.data === 'string') {
      try {
        const parsedData = JSON.parse(body.data);
        if (parsedData.imageUrl) {
          finalImageUrl = parsedData.imageUrl;
        }
      } catch (e) {
        // Fallback if parsing fails
      }
    } else if (body.data && body.data.imageUrl) {
      finalImageUrl = body.data.imageUrl;
    }

    if (file) {
      finalImageUrl = await this.productsService.uploadImage(file);
    }

    // FIXED: Added placeholder 'sku' attribute to fulfill CreateProductDto type definition requirements
    const dto: CreateProductDto = {
      sku: '',
      name: body.name || (body.data ? body.data.name : ''),
      description: body.description || (body.data ? body.data.description : ''),
      price: body.price ? parseFloat(body.price) : (body.data ? parseFloat(body.data.price) : 0),
      stock: body.stock ? parseInt(body.stock, 10) : (body.data ? parseInt(body.data.stock, 10) : 0),
      imageUrl: finalImageUrl,
      categoryId: body.categoryId || (body.data ? body.data.categoryId : undefined),
    };

    return this.productsService.create(dto, vendorId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('VENDOR')
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    return this.productsService.update(id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('VENDOR')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.productsService.remove(id);
  }

  @UseGuards(JwtAuthGuard) 
  @Post(':id/reviews')
  async addReview(
    @Param('id') productId: string,
    @Body() body: { rating: number; comment: string },
    @Request() req
  ) {
    return this.productsService.addReview(
      productId,
      req.user.id,
      body.rating,
      body.comment
    );
  }
}