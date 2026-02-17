import { Controller, Get, Patch, Body, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Users')
@Controller('users')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth('JWT')
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    @Get()
    @ApiOperation({ summary: 'Listar todos os usuários' })
    @ApiResponse({ status: 200, description: 'Lista de usuários retornada com sucesso' })
    async findAll(@Query('search') search?: string) {
        return this.usersService.findAll(search);
    }

    @Patch('push-token')
    @ApiOperation({ summary: 'Atualizar token de push do usuário' })
    async updatePushToken(
        @CurrentUser('id') userId: string,
        @Body('token') token: string
    ) {
        return this.usersService.updatePushToken(userId, token);
    }
}
