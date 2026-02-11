import { Module } from '@nestjs/common';
import { OrderFormsService } from './order-forms.service';
import { OrderFormsController } from './order-forms.controller';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [OrderFormsController],
    providers: [OrderFormsService],
    exports: [OrderFormsService],
})
export class OrderFormsModule { }
