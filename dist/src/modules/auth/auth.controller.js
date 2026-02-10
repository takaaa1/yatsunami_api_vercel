"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const passport_1 = require("@nestjs/passport");
const swagger_1 = require("@nestjs/swagger");
const auth_service_1 = require("./auth.service");
const dto_1 = require("./dto");
const decorators_1 = require("../../common/decorators");
let AuthController = class AuthController {
    authService;
    constructor(authService) {
        this.authService = authService;
    }
    async login(loginDto) {
        return this.authService.login(loginDto);
    }
    async register(registerDto) {
        return this.authService.register(registerDto);
    }
    async getProfile(userId) {
        return this.authService.getProfile(userId);
    }
    async updateProfile(userId, updateData, file) {
        return this.authService.updateProfile(userId, updateData, file);
    }
    async changePassword(userId, changePasswordDto) {
        return this.authService.changePassword(userId, changePasswordDto);
    }
    async refresh(userId) {
        const accessToken = await this.authService.validateRefreshToken(userId);
        return { accessToken };
    }
    async me(user) {
        return user;
    }
    async forgotPassword(forgotPasswordDto) {
        return this.authService.forgotPassword(forgotPasswordDto);
    }
    async verifyCode(verifyCodeDto) {
        return this.authService.verifyResetCode(verifyCodeDto);
    }
    async resetPassword(resetPasswordDto) {
        return this.authService.resetPassword(resetPasswordDto);
    }
    async uploadAvatar(userId, file) {
        return this.authService.uploadAvatar(userId, file);
    }
};
exports.AuthController = AuthController;
__decorate([
    (0, decorators_1.Public)(),
    (0, common_1.Post)('login'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Login com e-mail e senha' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Login realizado com sucesso', type: dto_1.AuthResponseDto }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Credenciais inválidas' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.LoginDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "login", null);
__decorate([
    (0, decorators_1.Public)(),
    (0, common_1.Post)('register'),
    (0, swagger_1.ApiOperation)({ summary: 'Registrar novo usuário' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Usuário criado com sucesso', type: dto_1.AuthResponseDto }),
    (0, swagger_1.ApiResponse)({ status: 409, description: 'E-mail já cadastrado' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.RegisterDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "register", null);
__decorate([
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    (0, swagger_1.ApiBearerAuth)('JWT'),
    (0, common_1.Get)('profile'),
    (0, swagger_1.ApiOperation)({ summary: 'Obter perfil do usuário autenticado' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Perfil retornado', type: dto_1.UserResponseDto }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Não autorizado' }),
    __param(0, (0, decorators_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "getProfile", null);
__decorate([
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    (0, swagger_1.ApiBearerAuth)('JWT'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file')),
    (0, common_1.Put)('profile'),
    (0, swagger_1.ApiOperation)({ summary: 'Atualizar perfil do usuário autenticado' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Perfil atualizado', type: dto_1.UserResponseDto }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Não autorizado' }),
    __param(0, (0, decorators_1.CurrentUser)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.UpdateProfileDto, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "updateProfile", null);
__decorate([
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    (0, swagger_1.ApiBearerAuth)('JWT'),
    (0, common_1.Post)('change-password'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Alterar senha do usuário autenticado' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Senha alterada com sucesso' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Senha atual incorreta' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Não autorizado' }),
    __param(0, (0, decorators_1.CurrentUser)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.ChangePasswordDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "changePassword", null);
__decorate([
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    (0, swagger_1.ApiBearerAuth)('JWT'),
    (0, common_1.Post)('refresh'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Renovar token de acesso' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Token renovado' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Não autorizado' }),
    __param(0, (0, decorators_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "refresh", null);
__decorate([
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    (0, swagger_1.ApiBearerAuth)('JWT'),
    (0, common_1.Get)('me'),
    (0, swagger_1.ApiOperation)({ summary: 'Obter dados mínimos do token JWT' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Dados do token' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Não autorizado' }),
    __param(0, (0, decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "me", null);
__decorate([
    (0, decorators_1.Public)(),
    (0, common_1.Post)('forgot-password'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Solicitar recuperação de senha' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Código de recuperação enviado por e-mail' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.ForgotPasswordDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "forgotPassword", null);
__decorate([
    (0, decorators_1.Public)(),
    (0, common_1.Post)('verify-code'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Verificar código de recuperação' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Código verificado com sucesso' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Código inválido ou expirado' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.VerifyCodeDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "verifyCode", null);
__decorate([
    (0, decorators_1.Public)(),
    (0, common_1.Post)('reset-password'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Redefinir senha com código' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Senha redefinida com sucesso' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Código inválido ou expirado' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.ResetPasswordDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "resetPassword", null);
__decorate([
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    (0, swagger_1.ApiBearerAuth)('JWT'),
    (0, common_1.Post)('avatar'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file')),
    (0, swagger_1.ApiOperation)({ summary: 'Upload de avatar do usuário' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Avatar carregado com sucesso' }),
    __param(0, (0, decorators_1.CurrentUser)('id')),
    __param(1, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "uploadAvatar", null);
exports.AuthController = AuthController = __decorate([
    (0, swagger_1.ApiTags)('Auth'),
    (0, common_1.Controller)('auth'),
    __metadata("design:paramtypes", [auth_service_1.AuthService])
], AuthController);
//# sourceMappingURL=auth.controller.js.map