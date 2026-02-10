import { IsEmail, IsString, MinLength, IsOptional, IsBoolean } from 'class-validator';
import { Transform } from 'class-transformer';
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

    @ApiPropertyOptional({ example: '11999998888', description: 'Telefone', nullable: true })
    @IsOptional()
    @IsString()
    telefone?: string | null;

    @ApiPropertyOptional({ example: 'dark', enum: ['light', 'dark', 'system'], description: 'Tema do app' })
    @IsOptional()
    @IsString()
    tema?: string;

    @ApiPropertyOptional({ example: 'pt-BR', enum: ['pt-BR', 'ja-JP'], description: 'Idioma' })
    @IsOptional()
    @IsString()
    idioma?: string;

    @ApiPropertyOptional({ example: '123.456.789-00', description: 'CPF ou CNPJ', nullable: true })
    @IsOptional()
    @IsString()
    cpfCnpj?: string | null;

    @ApiPropertyOptional({ example: 'Preferência por entrega sem contato', description: 'Observações', nullable: true })
    @IsOptional()
    @IsString()
    observacoes?: string | null;

    @ApiPropertyOptional({ description: 'Endereço (JSON)' })
    @IsOptional()
    @Transform(({ value }) => {
        if (typeof value === 'string') {
            try {
                return JSON.parse(value);
            } catch {
                return value;
            }
        }
        return value;
    })
    endereco?: any;

    @ApiPropertyOptional({ example: true, description: 'Receber notificações' })
    @IsOptional()
    @IsBoolean()
    @Transform(({ value }) => value === 'true' || value === true)
    receberNotificacoes?: boolean;

    @ApiPropertyOptional({ example: 'https://example.com/avatar.jpg', description: 'URL do avatar', nullable: true })
    @IsOptional()
    @IsString()
    avatarUrl?: string | null;
}

export class UserResponseDto {
    @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
    id: string;

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

    @ApiPropertyOptional({ example: 'https://example.com/avatar.jpg', nullable: true })
    avatarUrl?: string | null;
}

export class AuthResponseDto {
    @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIs...', description: 'JWT access token' })
    accessToken: string;

    @ApiProperty({ type: UserResponseDto })
    user: UserResponseDto;
}
