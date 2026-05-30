import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  // CREATE PRODUCT (AUTO SKU)
  async create(dto: CreateProductDto) {
    try {
      return await this.prisma.product.create({
        data: {
          sku: `SKU-${Date.now()}-${Math.random()
            .toString(36)
            .substring(2, 8)
            .toUpperCase()}`,
          name: dto.name,
          description: dto.description,
          price: dto.price,
          stock: dto.stock,
          imageUrl: dto.imageUrl,
          categoryId: dto.categoryId,
        },
      });
    } catch (error) {
      console.error('PRISMA ERROR:', error);
      throw error;
    }
  }

  // GET ALL PRODUCTS (pagination + search + filters + category)
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
      ...(categoryId && {
        categoryId,
      }),

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

      ...(inStock === 'true'
        ? {
            stock: {
              gt: 0,
            },
          }
        : {}),
    };

    const [items, totalItems] = await this.prisma.$transaction([
      this.prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          category: true,
        },
      }),

      this.prisma.product.count({
        where,
      }),
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
      },
    });
  }

  // UPDATE PRODUCT
  update(id: string, dto: UpdateProductDto) {
    return this.prisma.product.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.description && { description: dto.description }),
        ...(dto.price && { price: dto.price }),
        ...(dto.stock && { stock: dto.stock }),
        ...(dto.imageUrl && { imageUrl: dto.imageUrl }),
        ...(dto.categoryId && { categoryId: dto.categoryId }),
      },
    });
  }

  // DELETE PRODUCT
  remove(id: string) {
    return this.prisma.product.delete({
      where: { id },
    });
  }
}