import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private prisma: PrismaService) {
    const secret = process.env.JWT_SECRET;

    if (!secret) {
      throw new Error('JWT_SECRET is not defined in .env');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: secret,
      ignoreExpiration: false,
    });
  }

  async validate(payload: any) {
    // 1. Accept either 'sub' (translated token) or 'userId' (raw token)
    const userId = payload.sub || payload.userId;
    
    if (!userId) {
      throw new UnauthorizedException('Invalid token payload');
    }

    // 2. Fetch the user from the local Zentromart Prisma database
    let user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    // 3. If the user doesn't exist locally (e.g. Prisma was reset), create them on the fly!
    if (!user) {
      user = await this.prisma.user.create({
        data: {
          id: userId,
          email: payload.email || 'gateway@tawitawi.local',
          name: payload.name || 'Tawi-Tawi User',
          role: payload.role || 'USER',
          passwordHash: 'GATEWAY_SSO_USER',
        },
      });
    }

    return {
      id: user.id,
      email: user.email,
      role: user.role,
    };
  }
}