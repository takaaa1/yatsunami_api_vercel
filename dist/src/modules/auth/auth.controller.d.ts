import { AuthService } from './auth.service';
import { LoginDto, RegisterDto, ChangePasswordDto, UpdateProfileDto, AuthResponseDto } from './dto';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    login(loginDto: LoginDto): Promise<AuthResponseDto>;
    register(registerDto: RegisterDto): Promise<AuthResponseDto>;
    getProfile(userId: number): Promise<{
        id: number;
        email: string;
        nome: string;
        telefone: string | null;
        cpfCnpj: string | null;
        role: string;
        tema: string;
        idioma: string;
        endereco: import("@prisma/client/runtime/library").JsonValue;
        receberNotificacoes: boolean;
        criadoEm: Date;
    }>;
    updateProfile(userId: number, updateData: UpdateProfileDto): Promise<{
        id: number;
        email: string;
        nome: string;
        telefone: string | null;
        role: string;
        tema: string;
        idioma: string;
        endereco: import("@prisma/client/runtime/library").JsonValue;
        receberNotificacoes: boolean;
    }>;
    changePassword(userId: number, changePasswordDto: ChangePasswordDto): Promise<{
        message: string;
    }>;
    refresh(userId: number): Promise<{
        accessToken: string;
    }>;
    me(user: any): Promise<any>;
}
