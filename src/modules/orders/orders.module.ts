import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { ConfiguracoesModule } from '../configuracoes/configuracoes.module';

@Module({
    imports: [PrismaModule, ConfiguracoesModule],
    controllers: [OrdersController],
    providers: [OrdersService],
})
export class OrdersModule { }
