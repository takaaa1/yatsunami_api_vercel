import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { DeliveryService } from './delivery.service';
import { DeliveryController } from './delivery.controller';
import { RoutesService } from './routes.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { ConfiguracoesModule } from '../configuracoes/configuracoes.module';

import { TrackingGateway } from './tracking.gateway';

@Module({
    imports: [PrismaModule, HttpModule, ConfigModule, ConfiguracoesModule],
    controllers: [DeliveryController],
    providers: [DeliveryService, RoutesService, TrackingGateway],
    exports: [DeliveryService],
})
export class DeliveryModule { }
