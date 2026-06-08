import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

// backend/src/main.ts

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: '*',
    credentials: true,
  });

  const port = process.env.PORT || 10000;

  // CHANGE THIS:
  // await app.listen(port); 
  
  // TO THIS:
  await app.listen(port, '0.0.0.0');

  console.log(`Server running on http://0.0.0.0:${port}`);
}

bootstrap();