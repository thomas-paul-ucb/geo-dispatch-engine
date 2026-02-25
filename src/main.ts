import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common'; // Add this
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // The "Security Guard": intercepts every request
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true, // Strips away any fields not in our DTO
    transform: true, // Automatically converts types (e.g., string to number)
  }));

  await app.listen(3000);
}
bootstrap();