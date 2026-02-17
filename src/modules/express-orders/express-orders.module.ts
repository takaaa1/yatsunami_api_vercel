import { Module } from '@nestjs/common';
import { ExpressOrdersController } from './express-orders.controller';
import { ExpressOrdersService } from './express-orders.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [PrismaModule, NotificationsModule],
  controllers: [ExpressOrdersController],
  providers: [ExpressOrdersService],
})
export class ExpressOrdersModule { }
