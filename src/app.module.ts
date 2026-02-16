import { Module } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma';
import { AppConfigModule } from './config';
import { AuthModule } from './modules/auth';
import { ProductsModule } from './modules/products/products.module';
import { OrdersModule } from './modules/orders/orders.module';
import { HttpExceptionFilter } from './common/filters';
import { LoggingInterceptor, TransformInterceptor } from './common/interceptors';
import { CommonModule } from './common/common.module';
import { OrderFormsModule } from './modules/order-forms/order-forms.module';
import { ConfiguracoesModule } from './modules/configuracoes/configuracoes.module';
import { ExpressOrdersModule } from './modules/express-orders/express-orders.module';
import { DeliveryModule } from './modules/delivery/delivery.module';
import { SalesModule } from './modules/sales/sales.module';
import { ExpensesModule } from './modules/expenses/expenses.module';
import { PdfModule } from './modules/pdf/pdf.module';
import { UsersModule } from './modules/users/users.module';

@Module({
  imports: [
    AppConfigModule,
    PrismaModule,
    AuthModule,
    ProductsModule,
    OrdersModule,
    CommonModule,
    OrderFormsModule,
    ConfiguracoesModule,
    ExpressOrdersModule,
    DeliveryModule,
    SalesModule,
    ExpensesModule,
    ExpensesModule,
    PdfModule,
    UsersModule,
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
