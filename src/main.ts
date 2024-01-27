import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as process from 'process';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = new DocumentBuilder()
    .setTitle('سمند')
    .setDescription('سیستم متمرکز مانیتورهای دانشگاه')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('/api', app, document);
  app.enableCors({
    origin: process.env.CORS_ORIGINS.split(','),
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE'],
    preflightContinue: false,
    credentials: true,
  });
  await app.listen(+process.env.PORT);
  console.log(`Doc is available on http://localhost:${+process.env.PORT}/api `);
}
bootstrap();
