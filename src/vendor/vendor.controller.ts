import { 
  Controller, 
  Get, 
  Patch, 
  Req, 
  Body, 
  UseGuards, 
  UseInterceptors, 
  UploadedFile 
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { VendorService } from './vendor.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('VENDOR') 
@Controller('vendor')
export class VendorController {
  constructor(private readonly vendorService: VendorService) {}

  @Get('stats')
  getStats(@Req() req) {
    return this.vendorService.getDashboardStats(req.user.id);
  }

  @Get('products')
  getMyProducts(@Req() req) {
    return this.vendorService.getMyProducts(req.user.id);
  }

  // 🛠️ ADDED: Multipart Form Upload Endpoint
  @Patch('profile/update')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/avatars', // Saves the files securely on your backend host
        filename: (req, file, callback) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          callback(null, `vendor-logo-${uniqueSuffix}${ext}`);
        },
      }),
    }),
  )
  async updateProfile(
    @Req() req,
    @UploadedFile() file: Express.Multer.File,
    @Body('shopName') shopName?: string,
    @Body('shopAddress') shopAddress?: string,
    @Body('shopDescription') shopDescription?: string,
  ) {
    let computedAvatarUrl: string | undefined = undefined;
    if (file) {
      computedAvatarUrl = `/uploads/avatars/${file.filename}`;
    }

    return this.vendorService.updateProfileData(req.user.id, {
      shopName,
      shopAddress,
      shopDescription,
      avatarUrl: computedAvatarUrl,
    });
  }
}