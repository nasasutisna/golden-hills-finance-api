"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const app_module_1 = require("./app.module");
const transform_interceptor_1 = require("./common/interceptors/transform.interceptor");
const logging_interceptor_1 = require("./common/logging/logging.interceptor");
const timeout_interceptor_1 = require("./common/interceptors/timeout.interceptor");
const http_exception_filter_1 = require("./common/filters/http-exception.filter");
const query_error_filter_1 = require("./common/filters/query-error.filter");
const validation_pipe_1 = require("./common/pipes/validation.pipe");
async function bootstrap() {
    const logger = new common_1.Logger('Bootstrap');
    const app = await core_1.NestFactory.create(app_module_1.AppModule, {
        logger: ['error', 'warn', 'log', 'debug', 'verbose'],
    });
    const appConfig = app.get('AppConfig');
    const { port, apiPrefix, appName } = appConfig;
    app.setGlobalPrefix(apiPrefix);
    app.enableCors({
        origin: process.env.CORS_ORIGIN || '*',
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
        credentials: true,
    });
    app.useGlobalPipes(new validation_pipe_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
    }));
    app.useGlobalInterceptors(new logging_interceptor_1.LoggingInterceptor(), new transform_interceptor_1.TransformInterceptor(), new timeout_interceptor_1.TimeoutInterceptor(30000));
    app.useGlobalFilters(new http_exception_filter_1.HttpExceptionFilter(), new query_error_filter_1.QueryErrorFilter());
    if (process.env.SWAGGER_ENABLED !== 'false') {
        const config = new swagger_1.DocumentBuilder()
            .setTitle(appName || 'Golden Hills Finance API')
            .setDescription('API documentation for Golden Hills Finance Management System')
            .setVersion('1.0')
            .addBearerAuth({
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
            name: 'JWT',
            description: 'Enter JWT token',
            in: 'header',
        }, 'JWT-auth')
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
        const document = swagger_1.SwaggerModule.createDocument(app, config);
        const swaggerPath = process.env.SWAGGER_PATH || 'api/docs';
        swagger_1.SwaggerModule.setup(swaggerPath, app, document, {
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
    await app.listen(port);
    logger.log(`Application is running on: http://localhost:${port}/${apiPrefix}`);
    logger.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
}
bootstrap().catch((error) => {
    console.error('Error starting application:', error);
    process.exit(1);
});
//# sourceMappingURL=main.js.map