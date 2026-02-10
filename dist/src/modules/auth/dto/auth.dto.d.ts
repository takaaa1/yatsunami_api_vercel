export declare class LoginDto {
    email: string;
    password: string;
    rememberMe?: boolean;
}
export declare class RegisterDto {
    nome: string;
    email: string;
    password: string;
    telefone?: string;
    tema: string;
    idioma: string;
}
export declare class ChangePasswordDto {
    currentPassword: string;
    newPassword: string;
}
export declare class ForgotPasswordDto {
    email: string;
}
export declare class VerifyCodeDto {
    email: string;
    codigo: string;
}
export declare class ResetPasswordDto {
    email: string;
    codigo: string;
    newPassword: string;
}
export declare class UpdateProfileDto {
    nome?: string;
    telefone?: string | null;
    tema?: string;
    idioma?: string;
    cpfCnpj?: string | null;
    observacoes?: string | null;
    endereco?: any;
    receberNotificacoes?: boolean;
    avatarUrl?: string | null;
}
export declare class UserResponseDto {
    id: number;
    nome: string;
    email: string;
    role: string;
    tema: string;
    idioma: string;
    avatarUrl?: string | null;
}
export declare class AuthResponseDto {
    accessToken: string;
    user: UserResponseDto;
}
