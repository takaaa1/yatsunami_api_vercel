import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { ConfiguracoesModule } from '../configuracoes/configuracoes.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
    imports: [PrismaModule, ConfiguracoesModule, NotificationsModule],
    controllers: [OrdersController],
    providers: [OrdersService],
})
export class OrdersModule { }
