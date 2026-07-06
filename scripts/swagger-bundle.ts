import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { writeFileSync } from 'fs';
import { join } from 'path';
import { AppModule } from '../src/app.module';

async function generateSwaggerSpec() {
  const app = await NestFactory.create(AppModule);

  const config = new DocumentBuilder()
    .setTitle('Golden Hills Finance API')
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

  // Export to JSON
  const outputPath = join(process.cwd(), 'swagger-spec.json');
  writeFileSync(outputPath, JSON.stringify(document, null, 2));

  console.log(`Swagger spec exported to: ${outputPath}`);

  await app.close();
}

generateSwaggerSpec().catch((error) => {
  console.error('Error generating swagger spec:', error);
  process.exit(1);
});
