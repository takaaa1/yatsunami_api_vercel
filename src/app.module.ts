import { Module } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma';
import { AppConfigModule } from './config';
import { AuthModule } from './modules/auth';
import { ProductsModule } from './modules/products/products.module';
import { HttpExceptionFilter } from './common/filters';
import { LoggingInterceptor, TransformInterceptor } from './common/interceptors';
import { CommonModule } from './common/common.module';

@Module({
  imports: [
    AppConfigModule,
    PrismaModule,
    AuthModule,
    AuthModule,
    ProductsModule,
    CommonModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformInterceptor,
    },
  ],
})
export class AppModule { }
