import { Controller, Patch, Body, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { UsersService } from './users.service';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

/**
 * Controller dedicado para que o Nest/Express registe `PATCH users/push-token`
 * antes das rotas com `users/:id` do UsersController (match por ordem de registo).
 */
@ApiTags('Users')
@Controller('users')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@ApiBearerAuth('JWT')
export class UsersPushTokenController {
    constructor(private readonly usersService: UsersService) { }

    @Patch('push-token')
    @ApiOperation({ summary: 'Atualizar token de push do usuário autenticado' })
    async updatePushToken(
        @CurrentUser('id') userId: string,
        @Body('token') token: string,
    ) {
        return this.usersService.updatePushToken(userId, token);
    }
}
