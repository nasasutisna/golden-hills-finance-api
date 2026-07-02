import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { databaseConfig } from './database.config';
import { jwtConfig } from './jwt.config';
import { appConfig } from './app.config';
import { fileUploadConfig } from './file-upload.config';
import { paginationConfig } from './pagination.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [
        databaseConfig,
        jwtConfig,
        appConfig,
        fileUploadConfig,
        paginationConfig,
      ],
    }),
  ],
  exports: [ConfigModule],
})
export class AppConfigModule {}
