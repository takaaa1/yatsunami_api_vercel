import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateConfiguracaoDto } from './dto/update-configuracao.dto';

@Injectable()
export class ConfiguracoesService implements OnModuleInit {
    constructor(private prisma: PrismaService) { }

    async onModuleInit() {
        // Ensure the singleton record exists
        const config = await this.prisma.configuracaoFormularios.findFirst({
            where: { id: 1 },
        });

        if (!config) {
            await this.prisma.configuracaoFormularios.create({
                data: { id: 1 },
            });
        }
    }

    async get() {
        return this.prisma.configuracaoFormularios.findFirst({
            where: { id: 1 },
        });
    }

    async update(dto: UpdateConfiguracaoDto) {
        return this.prisma.configuracaoFormularios.update({
            where: { id: 1 },
            data: dto,
        });
    }
}
