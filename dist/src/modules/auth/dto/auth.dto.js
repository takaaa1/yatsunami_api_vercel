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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthResponseDto = exports.UserResponseDto = exports.UpdateProfileDto = exports.ResetPasswordDto = exports.VerifyCodeDto = exports.ForgotPasswordDto = exports.ChangePasswordDto = exports.RegisterDto = exports.LoginDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const swagger_1 = require("@nestjs/swagger");
class LoginDto {
    email;
    password;
    rememberMe;
}
exports.LoginDto = LoginDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'user@example.com', description: 'E-mail do usuário' }),
    (0, class_validator_1.IsEmail)({}, { message: 'Email inválido' }),
    __metadata("design:type", String)
], LoginDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '123456', minLength: 6, description: 'Senha do usuário' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(6, { message: 'Senha deve ter no mínimo 6 caracteres' }),
    __metadata("design:type", String)
], LoginDto.prototype, "password", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: true, description: 'Lembrar usuário' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], LoginDto.prototype, "rememberMe", void 0);
class RegisterDto {
    nome;
    email;
    password;
    telefone;
    tema;
    idioma;
}
exports.RegisterDto = RegisterDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'João Silva', description: 'Nome completo' }),
    (0, class_validator_1.IsString)({ message: 'Nome é obrigatório' }),
    __metadata("design:type", String)
], RegisterDto.prototype, "nome", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'joao@example.com', description: 'E-mail do usuário' }),
    (0, class_validator_1.IsEmail)({}, { message: 'Email inválido' }),
    __metadata("design:type", String)
], RegisterDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '123456', minLength: 6, description: 'Senha' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(6, { message: 'Senha deve ter no mínimo 6 caracteres' }),
    __metadata("design:type", String)
], RegisterDto.prototype, "password", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '11999998888', description: 'Telefone' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RegisterDto.prototype, "telefone", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'dark', enum: ['light', 'dark', 'system'], description: 'Tema inicial' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RegisterDto.prototype, "tema", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'pt-BR', enum: ['pt-BR', 'ja-JP'], description: 'Idioma inicial' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RegisterDto.prototype, "idioma", void 0);
class ChangePasswordDto {
    currentPassword;
    newPassword;
}
exports.ChangePasswordDto = ChangePasswordDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'senhaAtual123', minLength: 6, description: 'Senha atual' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(6),
    __metadata("design:type", String)
], ChangePasswordDto.prototype, "currentPassword", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'novaSenha456', minLength: 6, description: 'Nova senha' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(6),
    __metadata("design:type", String)
], ChangePasswordDto.prototype, "newPassword", void 0);
class ForgotPasswordDto {
    email;
}
exports.ForgotPasswordDto = ForgotPasswordDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'user@example.com', description: 'E-mail para redefinição de senha' }),
    (0, class_validator_1.IsEmail)(),
    __metadata("design:type", String)
], ForgotPasswordDto.prototype, "email", void 0);
class VerifyCodeDto {
    email;
    codigo;
}
exports.VerifyCodeDto = VerifyCodeDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'user@example.com', description: 'E-mail do usuário' }),
    (0, class_validator_1.IsEmail)(),
    __metadata("design:type", String)
], VerifyCodeDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '123456', description: 'Código de 6 dígitos enviado por e-mail' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(6),
    __metadata("design:type", String)
], VerifyCodeDto.prototype, "codigo", void 0);
class ResetPasswordDto {
    email;
    codigo;
    newPassword;
}
exports.ResetPasswordDto = ResetPasswordDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'user@example.com', description: 'E-mail do usuário' }),
    (0, class_validator_1.IsEmail)(),
    __metadata("design:type", String)
], ResetPasswordDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '123456', description: 'Código de 6 dígitos validado' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(6),
    __metadata("design:type", String)
], ResetPasswordDto.prototype, "codigo", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'novaSenha456', minLength: 6, description: 'Nova senha' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(6, { message: 'Senha deve ter no mínimo 6 caracteres' }),
    __metadata("design:type", String)
], ResetPasswordDto.prototype, "newPassword", void 0);
class UpdateProfileDto {
    nome;
    telefone;
    tema;
    idioma;
    cpfCnpj;
    observacoes;
    endereco;
    receberNotificacoes;
    avatarUrl;
}
exports.UpdateProfileDto = UpdateProfileDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'João Silva', description: 'Nome completo' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateProfileDto.prototype, "nome", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '11999998888', description: 'Telefone', nullable: true }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", Object)
], UpdateProfileDto.prototype, "telefone", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'dark', enum: ['light', 'dark', 'system'], description: 'Tema do app' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateProfileDto.prototype, "tema", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'pt-BR', enum: ['pt-BR', 'ja-JP'], description: 'Idioma' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateProfileDto.prototype, "idioma", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '123.456.789-00', description: 'CPF ou CNPJ', nullable: true }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", Object)
], UpdateProfileDto.prototype, "cpfCnpj", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Preferência por entrega sem contato', description: 'Observações', nullable: true }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", Object)
], UpdateProfileDto.prototype, "observacoes", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Endereço (JSON)' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(({ value }) => {
        if (typeof value === 'string') {
            try {
                return JSON.parse(value);
            }
            catch {
                return value;
            }
        }
        return value;
    }),
    __metadata("design:type", Object)
], UpdateProfileDto.prototype, "endereco", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: true, description: 'Receber notificações' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    (0, class_transformer_1.Transform)(({ value }) => value === 'true' || value === true),
    __metadata("design:type", Boolean)
], UpdateProfileDto.prototype, "receberNotificacoes", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'https://example.com/avatar.jpg', description: 'URL do avatar', nullable: true }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", Object)
], UpdateProfileDto.prototype, "avatarUrl", void 0);
class UserResponseDto {
    id;
    nome;
    email;
    role;
    tema;
    idioma;
    avatarUrl;
}
exports.UserResponseDto = UserResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: '123e4567-e89b-12d3-a456-426614174000' }),
    __metadata("design:type", String)
], UserResponseDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'João Silva' }),
    __metadata("design:type", String)
], UserResponseDto.prototype, "nome", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'joao@example.com' }),
    __metadata("design:type", String)
], UserResponseDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'user', enum: ['user', 'admin'] }),
    __metadata("design:type", String)
], UserResponseDto.prototype, "role", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'dark' }),
    __metadata("design:type", String)
], UserResponseDto.prototype, "tema", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'pt-BR' }),
    __metadata("design:type", String)
], UserResponseDto.prototype, "idioma", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'https://example.com/avatar.jpg', nullable: true }),
    __metadata("design:type", Object)
], UserResponseDto.prototype, "avatarUrl", void 0);
class AuthResponseDto {
    accessToken;
    user;
}
exports.AuthResponseDto = AuthResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'eyJhbGciOiJIUzI1NiIs...', description: 'JWT access token' }),
    __metadata("design:type", String)
], AuthResponseDto.prototype, "accessToken", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: UserResponseDto }),
    __metadata("design:type", UserResponseDto)
], AuthResponseDto.prototype, "user", void 0);
//# sourceMappingURL=auth.dto.js.map