import { IsString, IsNotEmpty, IsNumber, IsOptional, Min } from 'class-validator';

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  name!: string; 

  @IsString()
  @IsNotEmpty()
  description!: string; 

  @IsNumber()
  @Min(0) 
  price!: number; 

  @IsNumber()
  @Min(0) 
  stock!: number; 

  @IsString()
  @IsOptional()
  imageUrl?: string;

  @IsString()
  @IsOptional()
  categoryId?: string; 
}