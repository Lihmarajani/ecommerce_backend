import { IsEmail, IsNotEmpty, IsString, MinLength, IsOptional } from 'class-validator';

export class RegisterDto {
  @IsString()
  @IsNotEmpty()
  name!: string; 

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(6)
  password!: string; 

  @IsString()
  @IsOptional()
  role?: string;

  // --- NEW FIELDS ---
  @IsString()
  @IsOptional()
  shopName?: string;

  @IsString()
  @IsOptional()
  shopAddress?: string;
}