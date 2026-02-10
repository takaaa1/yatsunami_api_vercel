export declare class LoginDto {
    email: string;
    password: string;
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
export declare class ResetPasswordDto {
    token: string;
    newPassword: string;
}
export declare class UpdateProfileDto {
    nome?: string;
    telefone?: string;
    tema?: string;
    idioma?: string;
    endereco?: any;
    receberNotificacoes?: boolean;
}
export declare class UserResponseDto {
    id: number;
    nome: string;
    email: string;
    role: string;
    tema: string;
    idioma: string;
}
export declare class AuthResponseDto {
    accessToken: string;
    user: UserResponseDto;
}
