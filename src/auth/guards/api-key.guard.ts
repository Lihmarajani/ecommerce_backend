import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import { ConfigService } from '@nestjs/config';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();

    // Get API key from headers
    const apiKey = request.headers['x-api-key'];

    // Load valid key from .env
    const validApiKey = this.configService.get<string>('INTEGRATION_API_KEY');

    // 1. Check if key exists
    if (!apiKey) {
      throw new UnauthorizedException('API key missing');
    }

    // 2. Validate key
    if (apiKey !== validApiKey) {
      throw new UnauthorizedException('Invalid API key');
    }

    return true;
  }
}