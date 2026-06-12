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
    const gatewayEmail = payload.email; 
    const lookupId = payload.sub || payload.userId;

    if (!lookupId) {
      throw new UnauthorizedException('Invalid token payload');
    }

    let user: any = null;

    // 1. CROSS-SERVICE LINK: Prioritize finding the existing Zentromart user by email!
    if (gatewayEmail) {
      user = await this.prisma.user.findUnique({
        where: { email: gatewayEmail },
      });
    }

    // 2. FALLBACK: Look up by ID if email is not in payload or user not found
    if (!user) {
      user = await this.prisma.user.findUnique({
        where: { id: lookupId },
      });
    }

    // 3. AUTO-SYNC: Create only if they completely don't exist
    if (!user) {
      user = await this.prisma.user.create({
        data: {
          id: lookupId, 
          email: gatewayEmail || 'gateway@tawitawi.local',
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