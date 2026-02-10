import {
    Controller,
    Post,
    Get,
    Put,
    Body,
    UseGuards,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import {
    LoginDto,
    RegisterDto,
    ChangePasswordDto,
    UpdateProfileDto,
    AuthResponseDto,
    UserResponseDto,
} from './dto';
import { CurrentUser, Public } from '../../common/decorators';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Public()
    @Post('login')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Login com e-mail e senha' })
    @ApiResponse({ status: 200, description: 'Login realizado com sucesso', type: AuthResponseDto })
    @ApiResponse({ status: 401, description: 'Credenciais inválidas' })
    async login(@Body() loginDto: LoginDto) {
        return this.authService.login(loginDto);
    }

    @Public()
    @Post('register')
    @ApiOperation({ summary: 'Registrar novo usuário' })
    @ApiResponse({ status: 201, description: 'Usuário criado com sucesso', type: AuthResponseDto })
    @ApiResponse({ status: 409, description: 'E-mail já cadastrado' })
    async register(@Body() registerDto: RegisterDto) {
        return this.authService.register(registerDto);
    }

    @UseGuards(AuthGuard('jwt'))
    @ApiBearerAuth('JWT')
    @Get('profile')
    @ApiOperation({ summary: 'Obter perfil do usuário autenticado' })
    @ApiResponse({ status: 200, description: 'Perfil retornado', type: UserResponseDto })
    @ApiResponse({ status: 401, description: 'Não autorizado' })
    async getProfile(@CurrentUser('id') userId: number) {
        return this.authService.getProfile(userId);
    }

    @UseGuards(AuthGuard('jwt'))
    @ApiBearerAuth('JWT')
    @Put('profile')
    @ApiOperation({ summary: 'Atualizar perfil do usuário autenticado' })
    @ApiResponse({ status: 200, description: 'Perfil atualizado', type: UserResponseDto })
    @ApiResponse({ status: 401, description: 'Não autorizado' })
    async updateProfile(
        @CurrentUser('id') userId: number,
        @Body() updateData: UpdateProfileDto,
    ) {
        return this.authService.updateProfile(userId, updateData);
    }

    @UseGuards(AuthGuard('jwt'))
    @ApiBearerAuth('JWT')
    @Post('change-password')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Alterar senha do usuário autenticado' })
    @ApiResponse({ status: 200, description: 'Senha alterada com sucesso' })
    @ApiResponse({ status: 400, description: 'Senha atual incorreta' })
    @ApiResponse({ status: 401, description: 'Não autorizado' })
    async changePassword(
        @CurrentUser('id') userId: number,
        @Body() changePasswordDto: ChangePasswordDto,
    ) {
        return this.authService.changePassword(userId, changePasswordDto);
    }

    @UseGuards(AuthGuard('jwt'))
    @ApiBearerAuth('JWT')
    @Post('refresh')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Renovar token de acesso' })
    @ApiResponse({ status: 200, description: 'Token renovado' })
    @ApiResponse({ status: 401, description: 'Não autorizado' })
    async refresh(@CurrentUser('id') userId: number) {
        const accessToken = await this.authService.validateRefreshToken(userId);
        return { accessToken };
    }

    @UseGuards(AuthGuard('jwt'))
    @ApiBearerAuth('JWT')
    @Get('me')
    @ApiOperation({ summary: 'Obter dados mínimos do token JWT' })
    @ApiResponse({ status: 200, description: 'Dados do token' })
    @ApiResponse({ status: 401, description: 'Não autorizado' })
    async me(@CurrentUser() user: any) {
        return user;
    }
}
