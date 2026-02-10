import { IsEmail, IsString, MinLength, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LoginDto {
    @ApiProperty({ example: 'user@example.com', description: 'E-mail do usuário' })
    @IsEmail({}, { message: 'Email inválido' })
    email: string;

    @ApiProperty({ example: '123456', minLength: 6, description: 'Senha do usuário' })
    @IsString()
    @MinLength(6, { message: 'Senha deve ter no mínimo 6 caracteres' })
    password: string;

    @ApiPropertyOptional({ example: true, description: 'Lembrar usuário' })
    @IsOptional()
    @IsBoolean()
    rememberMe?: boolean;
}

export class RegisterDto {
    @ApiProperty({ example: 'João Silva', description: 'Nome completo' })
    @IsString({ message: 'Nome é obrigatório' })
    nome: string;

    @ApiProperty({ example: 'joao@example.com', description: 'E-mail do usuário' })
    @IsEmail({}, { message: 'Email inválido' })
    email: string;

    @ApiProperty({ example: '123456', minLength: 6, description: 'Senha' })
    @IsString()
    @MinLength(6, { message: 'Senha deve ter no mínimo 6 caracteres' })
    password: string;

    @ApiPropertyOptional({ example: '11999998888', description: 'Telefone' })
    @IsOptional()
    @IsString()
    telefone?: string;

    @ApiProperty({ example: 'dark', enum: ['light', 'dark', 'system'], description: 'Tema inicial' })
    @IsString()
    tema: string;

    @ApiProperty({ example: 'pt-BR', enum: ['pt-BR', 'ja-JP'], description: 'Idioma inicial' })
    @IsString()
    idioma: string;
}

export class ChangePasswordDto {
    @ApiProperty({ example: 'senhaAtual123', minLength: 6, description: 'Senha atual' })
    @IsString()
    @MinLength(6)
    currentPassword: string;

    @ApiProperty({ example: 'novaSenha456', minLength: 6, description: 'Nova senha' })
    @IsString()
    @MinLength(6)
    newPassword: string;
}

export class ForgotPasswordDto {
    @ApiProperty({ example: 'user@example.com', description: 'E-mail para redefinição de senha' })
    @IsEmail()
    email: string;
}

export class VerifyCodeDto {
    @ApiProperty({ example: 'user@example.com', description: 'E-mail do usuário' })
    @IsEmail()
    email: string;

    @ApiProperty({ example: '123456', description: 'Código de 6 dígitos enviado por e-mail' })
    @IsString()
    @MinLength(6)
    codigo: string;
}

export class ResetPasswordDto {
    @ApiProperty({ example: 'user@example.com', description: 'E-mail do usuário' })
    @IsEmail()
    email: string;

    @ApiProperty({ example: '123456', description: 'Código de 6 dígitos validado' })
    @IsString()
    @MinLength(6)
    codigo: string;

    @ApiProperty({ example: 'novaSenha456', minLength: 6, description: 'Nova senha' })
    @IsString()
    @MinLength(6, { message: 'Senha deve ter no mínimo 6 caracteres' })
    newPassword: string;
}

export class UpdateProfileDto {
    @ApiPropertyOptional({ example: 'João Silva', description: 'Nome completo' })
    @IsOptional()
    @IsString()
    nome?: string;

    @ApiPropertyOptional({ example: '11999998888', description: 'Telefone' })
    @IsOptional()
    @IsString()
    telefone?: string;

    @ApiPropertyOptional({ example: 'dark', enum: ['light', 'dark', 'system'], description: 'Tema do app' })
    @IsOptional()
    @IsString()
    tema?: string;

    @ApiPropertyOptional({ example: 'pt-BR', enum: ['pt-BR', 'ja-JP'], description: 'Idioma' })
    @IsOptional()
    @IsString()
    idioma?: string;

    @ApiPropertyOptional({ example: '123.456.789-00', description: 'CPF ou CNPJ' })
    @IsOptional()
    @IsString()
    cpfCnpj?: string;

    @ApiPropertyOptional({ example: 'Preferência por entrega sem contato', description: 'Observações' })
    @IsOptional()
    @IsString()
    observacoes?: string;

    @ApiPropertyOptional({ description: 'Endereço (JSON)' })
    @IsOptional()
    endereco?: any;

    @ApiPropertyOptional({ example: true, description: 'Receber notificações' })
    @IsOptional()
    @IsBoolean()
    receberNotificacoes?: boolean;
}

export class UserResponseDto {
    @ApiProperty({ example: 1 })
    id: number;

    @ApiProperty({ example: 'João Silva' })
    nome: string;

    @ApiProperty({ example: 'joao@example.com' })
    email: string;

    @ApiProperty({ example: 'user', enum: ['user', 'admin'] })
    role: string;

    @ApiProperty({ example: 'dark' })
    tema: string;

    @ApiProperty({ example: 'pt-BR' })
    idioma: string;
}

export class AuthResponseDto {
    @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIs...', description: 'JWT access token' })
    accessToken: string;

    @ApiProperty({ type: UserResponseDto })
    user: UserResponseDto;
}
