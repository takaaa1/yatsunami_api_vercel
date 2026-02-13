import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ConfiguracoesService } from './configuracoes.service';
import { UpdateConfiguracaoDto } from './dto/update-configuracao.dto';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../../common/decorators';
import { RolesGuard } from '../../common/guards';

@ApiTags('Configuracoes')
@Controller('configuracoes')
@ApiBearerAuth('JWT')
export class ConfiguracoesController {
    constructor(private readonly configuracoesService: ConfiguracoesService) { }

    @Get()
    @ApiOperation({ summary: 'Busca as configurações globais' })
    async getConfig() {
        return this.configuracoesService.get();
    }

    @Patch()
    @Roles('admin')
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @ApiOperation({ summary: 'Atualiza as configurações globais' })
    async updateConfig(@Body() body: UpdateConfiguracaoDto) {
        return this.configuracoesService.update(body);
    }
}
