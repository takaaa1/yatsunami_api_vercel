import { Module } from '@nestjs/common';
import { ConfiguracoesService } from './configuracoes.service';
import { ConfiguracoesController } from './configuracoes.controller';
import { PrismaModule } from '../../prisma';

@Module({
    imports: [PrismaModule],
    providers: [ConfiguracoesService],
    controllers: [ConfiguracoesController],
    exports: [ConfiguracoesService],
})
export class ConfiguracoesModule { }
