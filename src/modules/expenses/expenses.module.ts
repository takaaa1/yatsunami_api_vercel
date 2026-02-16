import { Module } from '@nestjs/common';
import { ExpensesController } from './expenses.controller';
import { ExpensesService } from './expenses.service';
import { QrParserService } from './qr-parser.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [ExpensesController],
    providers: [ExpensesService, QrParserService],
    exports: [ExpensesService],
})
export class ExpensesModule { }
