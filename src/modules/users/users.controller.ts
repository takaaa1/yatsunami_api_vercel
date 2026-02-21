import {
    Controller,
    Get,
    Patch,
    Post,
    Delete,
    Body,
    Query,
    Param,
    UseGuards,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiOperation,
    ApiResponse,
    ApiTags,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { UsersService } from './users.service';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserFilterDto } from './dto/user-filter.dto';

@ApiTags('Users')
@Controller('users')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@ApiBearerAuth('JWT')
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    @Get()
    @Roles('admin')
    @ApiOperation({ summary: 'Listar usuários (filtros: search, role, ativo)' })
    @ApiResponse({ status: 200, description: 'Lista de usuários' })
    async findAll(@Query() filter: UserFilterDto) {
        return this.usersService.findAll(filter);
    }

    @Get(':id')
    @Roles('admin')
    @ApiOperation({ summary: 'Detalhes do usuário' })
    @ApiResponse({ status: 200, description: 'Usuário encontrado' })
    @ApiResponse({ status: 404, description: 'Usuário não encontrado' })
    async findOne(@Param('id') id: string) {
        return this.usersService.findOne(id);
    }

    @Patch(':id')
    @Roles('admin')
    @ApiOperation({ summary: 'Atualizar dados do usuário (inclui role, ativo)' })
    @ApiResponse({ status: 200, description: 'Usuário atualizado' })
    @ApiResponse({ status: 404, description: 'Usuário não encontrado' })
    async update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
        return this.usersService.update(id, dto);
    }

    @Post(':id/activate')
    @Roles('admin')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Ativar usuário' })
    @ApiResponse({ status: 200, description: 'Usuário ativado' })
    async activate(@Param('id') id: string) {
        return this.usersService.activate(id);
    }

    @Post(':id/deactivate')
    @Roles('admin')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Desativar usuário' })
    @ApiResponse({ status: 200, description: 'Usuário desativado' })
    async deactivate(@Param('id') id: string) {
        return this.usersService.deactivate(id);
    }

    @Delete(':id')
    @Roles('admin')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Excluir usuário permanentemente' })
    @ApiResponse({ status: 204, description: 'Usuário excluído' })
    async remove(@Param('id') id: string) {
        return this.usersService.remove(id);
    }

    @Patch('push-token')
    @ApiOperation({ summary: 'Atualizar token de push do usuário autenticado' })
    async updatePushToken(
        @CurrentUser('id') userId: string,
        @Body('token') token: string,
    ) {
        return this.usersService.updatePushToken(userId, token);
    }
}
