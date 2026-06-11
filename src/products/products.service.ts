import { Injectable, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Prisma } from '@prisma/client';

import { v2 as cloudinary } from 'cloudinary';
import * as streamifier from 'streamifier';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {
    cloudinary.config({
      cloud_name: 'dpzyfkakh', 
      api_key: '182279576924456',       
      api_secret: 'nih6WcqvCtRg54glGaJP0INK7hM', 
    });
  }

  async uploadImage(file: any): Promise<string> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: 'community_commerce_products' },
        (error, result) => {
          if (error || !result) return reject(new BadRequestException('Image upload failed'));
          resolve(result.secure_url);
        },
      );
      streamifier.createReadStream(file.buffer).pipe(uploadStream);
    });
  }

  // CREATE PRODUCT
  async create(dto: CreateProductDto, vendorId: string) {
    const generatedSku = `SKU-${Date.now()}-${Math.random()
      .toString(36)
      .substring(2, 8)
      .toUpperCase()}`;

    return await this.prisma.product.create({
      data: {
        sku: generatedSku, 
        name: dto.name,
        description: dto.description,
        price: Number(dto.price),
        stock: Number(dto.stock),
        imageUrl: dto.imageUrl, 
        categoryId: dto.categoryId,
        vendorId: vendorId, 
      },
    });
  }

  // GET ALL PRODUCTS
  async findAll(filters: {
    page?: number;
    limit?: number;
    search?: string;
    minPrice?: string;
    maxPrice?: string;
    inStock?: string;
    categoryId?: string;
  }) {
    const page = Number(filters.page) || 1;
    const limit = Number(filters.limit) || 10;
    const skip = (page - 1) * limit;

    const { search, minPrice, maxPrice, inStock, categoryId } = filters;

    const where: Prisma.ProductWhereInput = {
      ...(categoryId && { categoryId }),
      ...(search && {
        name: {
          contains: search,
          mode: Prisma.QueryMode.insensitive,
        },
      }),
      ...(minPrice || maxPrice
        ? {
            price: {
              gte: minPrice ? Number(minPrice) : undefined,
              lte: maxPrice ? Number(maxPrice) : undefined,
            },
          }
        : {}),
      ...(inStock === 'true' ? { stock: { gt: 0 } } : {}),
    };

    const [items, totalItems] = await this.prisma.$transaction([
      this.prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          category: true,
          reviews: true, 
        },
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      items,
      totalItems,
      totalPages: Math.ceil(totalItems / limit),
      page,
      limit,
    };
  }

  // GET SINGLE PRODUCT
  findOne(id: string) {
    return this.prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        reviews: true, 
        vendor: {
          select: { shopName: true },
        },
      },
    });
  }

  // CONCURRENCY-SAFE DATA UPDATE ROUTINE
  async update(id: string, dto: UpdateProductDto & { clientUpdatedAt?: string }) {
    // 1. Fetch current record master parameters directly from your PostgreSQL cluster instance
    const existingProduct = await this.prisma.product.findUnique({ where: { id } });

    if (!existingProduct) {
      throw new BadRequestException("Target catalog product record was not found.");
    }

    // 2. Perform optimistic timestamp validations if provided by client payload records
    if (dto.clientUpdatedAt) {
      const clientTime = new Date(dto.clientUpdatedAt).getTime();
      const serverTime = new Date(existingProduct.updatedAt).getTime();

      // Drop update silently or warn client if newer changes exist on server
      if (clientTime < serverTime) {
        throw new ConflictException("Sync rejected: A newer modification state is saved in cloud database.");
      }
    }

    return await this.prisma.product.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.description && { description: dto.description }),
        ...(dto.price && { price: Number(dto.price) }),
        ...(dto.stock && { stock: Number(dto.stock) }),
        ...(dto.imageUrl && { imageUrl: dto.imageUrl }),
        ...(dto.categoryId && { categoryId: dto.categoryId }),
      },
    });
  }

  // SAFE DELETE METHOD
  async remove(id: string) {
    try {
      await this.prisma.cartItem.deleteMany({
        where: { productId: id },
      });

      return await this.prisma.product.delete({
        where: { id },
      });
      
    } catch (error: any) {
      if (error.code === 'P2003') {
        throw new BadRequestException("Cannot delete this product because it is tied to an existing customer order.");
      }
      throw error;
    }
  }

  // ADD REVIEW METHOD
  async addReview(productId: string, userId: string, rating: number, comment: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    await this.prisma.review.create({
      data: {
        rating,
        comment,
        username: user?.name || 'Customer',
        productId,
        userId,
      },
    });

    const allReviews = await this.prisma.review.findMany({ where: { productId } });
    const avgRating = allReviews.reduce((sum, rev) => sum + rev.rating, 0) / allReviews.length;

    return this.prisma.product.update({
      where: { id: productId },
      data: { averageRating: avgRating },
      include: { reviews: true } 
    });
  }
}