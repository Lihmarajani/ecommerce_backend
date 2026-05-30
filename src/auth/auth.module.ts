import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { GatewayController } from './gateway.controller';
// Import PrismaModule instead of PrismaService
import { PrismaModule } from '../prisma/prisma.module'; 
import { JwtStrategy } from './jwt.strategy';

@Module({
  imports: [
    PassportModule,
    JwtModule.register({}),
    PrismaModule, // Add PrismaModule to the imports array
  ],
  controllers: [AuthController, GatewayController],
  // Remove PrismaService from the providers array
  providers: [AuthService, JwtStrategy], 
  exports: [AuthService],
})
export class AuthModule {}