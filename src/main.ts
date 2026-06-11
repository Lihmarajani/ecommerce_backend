import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express'; // 💡 Crucial type import for static configuration
import { join } from 'path';

async function bootstrap() {
  // 🛠️ Cast your application instance to NestExpressApplication to support static folder routing
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.enableCors({
    origin: '*',
    credentials: true,
  });

 
  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads/',
  });

  const port = process.env.PORT || 10000;

  // BINDING FIXED: Explicitly listens on all interfaces to receive hotspot traffic
  await app.listen(port, '0.0.0.0');

  console.log(`Server running on http://0.0.0.0:${port}`);
}

bootstrap();