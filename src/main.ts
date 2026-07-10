import { NestFactory, Reflector } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { LoggingInterceptor } from './common/logging/logging.interceptor';
import { TimeoutInterceptor } from './common/interceptors/timeout.interceptor';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { QueryErrorFilter } from './common/filters/query-error.filter';
import { ValidationPipe as CustomValidationPipe } from './common/pipes/validation.pipe';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  // Get app config
  const appConfig = app.get('AppConfig');
  const { port, apiPrefix, appName } = appConfig;

  // Set global prefix
  app.setGlobalPrefix(apiPrefix);

  // Enable CORS
  app.enableCors({
    origin: process.env.CORS_ORIGIN || '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new CustomValidationPipe({
      whitelist: false,
      forbidNonWhitelisted: false,
      transform: true,
    }),
  );

  // Global interceptors
  app.useGlobalInterceptors(
    new LoggingInterceptor(),
    new TransformInterceptor(),
    new TimeoutInterceptor(30000),
  );

  // Global exception filters
  app.useGlobalFilters(
    new HttpExceptionFilter(),
    new QueryErrorFilter(),
  );

  // Swagger documentation
  if (process.env.SWAGGER_ENABLED !== 'false') {
    const config = new DocumentBuilder()
      .setTitle(appName || 'Golden Hills Finance API')
      .setDescription('API documentation for Golden Hills Finance Management System')
      .setVersion('1.0')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          name: 'JWT',
          description: 'Enter JWT token',
          in: 'header',
        },
        'JWT-auth',
      )
      .addTag('Authentication', 'User authentication and authorization endpoints')
      .addTag('Users', 'User management endpoints')
      .addTag('Roles', 'Role management endpoints')
      .addTag('Residents', 'Resident management endpoints')
      .addTag('House Blocks', 'House block management endpoints')
      .addTag('Employees', 'Employee management endpoints')
      .addTag('Employee Positions', 'Employee position management endpoints')
      .addTag('Fee Types', 'Fee type management endpoints')
      .addTag('Invoices', 'Invoice management endpoints')
      .addTag('Payments', 'Payment management endpoints')
      .addTag('Transaction Categories', 'Transaction category management endpoints')
      .addTag('Cash Transactions', 'Cash transaction management endpoints')
      .addTag('Inventory', 'Inventory management endpoints')
      .addTag('Inventory Requests', 'Inventory request management endpoints')
      .addTag('Salary Components', 'Salary component management endpoints')
      .addTag('Employee Salaries', 'Employee salary management endpoints')
      .addTag('Cash Advances', 'Employee cash advance management endpoints')
      .addTag('Community Events', 'Community event management endpoints')
      .addTag('Notifications', 'Notification management endpoints')
      .addTag('File Attachments', 'File attachment management endpoints')
      .addTag('Health', 'Health check endpoints')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    const swaggerPath = process.env.SWAGGER_PATH || 'api/docs';
    SwaggerModule.setup(swaggerPath, app, document, {
      swaggerOptions: {
        persistAuthorization: true,
        docExpansion: 'none',
        filter: true,
        showRequestDuration: true,
      },
      customSiteTitle: 'Golden Hills Finance API Docs',
    });

    logger.log(`Swagger documentation available at: http://localhost:${port}/${swaggerPath}`);
  }

  // Start server
  await app.listen(port);
  logger.log(`Application is running on: http://localhost:${port}/${apiPrefix}`);
  logger.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
}

bootstrap().catch((error) => {
  console.error('Error starting application:', error);
  process.exit(1);
});
