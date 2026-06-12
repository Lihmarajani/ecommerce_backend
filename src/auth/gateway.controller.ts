import { Controller, Post, Body, Headers, UnauthorizedException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Controller()
export class GatewayController {
  private readonly logger = new Logger(GatewayController.name);

  constructor(private prisma: PrismaService) {}

  @Post('verify-user')
  async verifyUser(
    @Headers('x-internal-gateway-secret') secret: string,
    @Body() body: { tawiTawiUserId: string; email: string; fullName: string }
  ) {
    if (secret !== process.env.INTEGRATION_API_KEY) {
      this.logger.warn('Unauthorized gateway handshake attempt');
      throw new UnauthorizedException('Invalid internal gateway secret');
    }

    // Look for the user by email (or a dedicated tawiTawiUserId field if added to Prisma)
    const user = await this.prisma.user.findUnique({
      where: { email: body.email },
    });

    if (user) {
      return {
        isLinked: true,
        requiresRegistration: false,
        externalUserId: user.id,
        role: user.role,
      };
    }

    return {
      isLinked: false,
      requiresRegistration: true,
      externalUserId: null,
    };
  }

  @Post('register-user')
  async registerUser(
    @Headers('x-internal-gateway-secret') secret: string,
    @Body() body: any
  ) {
    console.log('--- GATEWAY REGISTRATION ---');
    console.log('Received body:', body);
    console.log('----------------------------');
    if (secret !== process.env.INTEGRATION_API_KEY) {
      this.logger.warn('Unauthorized gateway registration attempt');
      throw new UnauthorizedException('Invalid internal gateway secret');
    }

    // Provide a dummy password hash since Gateway users do not use local passwords
    const newUser = await this.prisma.user.create({
      data: {
        email: body.email,
        name: body.fullName,
        role: (body.role || 'USER') as any,
        passwordHash: 'GATEWAY_SSO_USER', // Add this line to satisfy Prisma
      },
    });

    this.logger.log(`Linked new Tawi-Tawi user: ${newUser.id}`);

    return {
      isLinked: true,
      externalUserId: newUser.id,
    };
  }
}