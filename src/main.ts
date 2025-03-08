/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger, ValidationPipe, VersioningType } from '@nestjs/common';
import { GlobalExceptionFilter } from './common/exceptions/http-exception.filter';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: true });

  const configService = app.get<ConfigService>(ConfigService) as ConfigService;
  const logger = new Logger('Bootstrap');

  const environment = process.env.NODE_ENV || 'development';
  const port = configService.get<number>('PORT', 4000);
  const swaggerPath = configService.get<string>('SWAGGER_PATH', `/api/v1/docs`);

  const corsOrigin: string = configService.get<string>('CORS_ORIGIN') ?? '*';

  app.enableCors({
    origin: corsOrigin,
    methods: ['GET', 'POST'],
    credentials: true,
  });
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  const swaggerServers = [`http://localhost:${port}`];

  const swaggerBuilder = new DocumentBuilder()
    .setTitle(configService.get<string>('APP_NAME', 'Markdown Editor'))
    .setVersion(configService.get<string>('APP_VERSION', '1.0'))
    .addTag('Nestjs-Server')
    .addBearerAuth()
    .addApiKey({ type: 'apiKey', name: 'x-api-key', in: 'header' });

  swaggerServers.forEach((server) => {
    swaggerBuilder.addServer(server);
  });

  const swaggerConfig = swaggerBuilder.build();

  app.useGlobalFilters(new GlobalExceptionFilter());
  app.useGlobalPipes(
    new ValidationPipe({
      validationError: { target: false, value: false },
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      forbidNonWhitelisted: false,
      whitelist: true,
    }),
  );

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup(swaggerPath, app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  await app.listen(port, '0.0.0.0');

  logger.log(`🚀 Environment: ${environment}`);
  logger.log(`🌐 Application is running on: ${await app.getUrl()}`);
  logger.log(
    `📄 Swagger documentation is available at: ${await app.getUrl()}${swaggerPath}`,
  );
}

bootstrap().catch((error) => {
  const logger = new Logger('Bootstrap');
  logger.error('Failed to start the application', error);
  process.exit(1);
});
