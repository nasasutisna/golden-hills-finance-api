import { registerAs } from '@nestjs/config';

export const appConfig = registerAs('app', () => ({
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  apiPrefix: process.env.API_PREFIX || 'api/v1',
  appName: process.env.APP_NAME || 'Golden Hills Finance Management System',
  appUrl: process.env.APP_URL || 'http://localhost:3000',
  logLevel: process.env.LOG_LEVEL || 'debug',
}));

export const getAppConfig = () => appConfig;
