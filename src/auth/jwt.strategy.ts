import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
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

  // jwt.strategy.ts
async validate(payload: any) {
  if (!payload.sub) {
    throw new UnauthorizedException('Invalid token payload');
  }

  return {
    id: payload.sub, // Changed from userId to id so it matches req.user.id
    email: payload.email,
    role: payload.role || 'USER',
  };
}
}