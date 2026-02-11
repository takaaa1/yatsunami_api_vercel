import { AuthService } from './auth.service';
import { LoginDto, RegisterDto, ChangePasswordDto, UpdateProfileDto, ForgotPasswordDto, VerifyCodeDto, ResetPasswordDto, AuthResponseDto } from './dto';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    login(loginDto: LoginDto): Promise<AuthResponseDto>;
    register(registerDto: RegisterDto): Promise<AuthResponseDto>;
    getProfile(userId: string): Promise<{
        email: string;
        id: string;
        nome: string;
        telefone: string | null;
        cpfCnpj: string | null;
        observacoes: string | null;
        role: string;
        tema: string;
        idioma: string;
        endereco: import("@prisma/client/runtime/library").JsonValue;
        receberNotificacoes: boolean;
        criadoEm: Date;
        avatarUrl: string | null;
    }>;
    updateProfile(userId: string, updateData: UpdateProfileDto, file?: Express.Multer.File): Promise<{
        email: string;
        id: string;
        nome: string;
        telefone: string | null;
        cpfCnpj: string | null;
        observacoes: string | null;
        role: string;
        tema: string;
        idioma: string;
        endereco: import("@prisma/client/runtime/library").JsonValue;
        receberNotificacoes: boolean;
        avatarUrl: string | null;
    }>;
    changePassword(userId: string, changePasswordDto: ChangePasswordDto): Promise<{
        message: string;
    }>;
    refresh(userId: string): Promise<{
        accessToken: string;
    }>;
    me(user: any): Promise<any>;
    forgotPassword(forgotPasswordDto: ForgotPasswordDto): Promise<{
        message: string;
    }>;
    verifyCode(verifyCodeDto: VerifyCodeDto): Promise<{
        valid: boolean;
    }>;
    resetPassword(resetPasswordDto: ResetPasswordDto): Promise<{
        message: string;
    }>;
    uploadAvatar(userId: string, file: Express.Multer.File): Promise<{
        email: string;
        id: string;
        nome: string;
        avatarUrl: string | null;
    }>;
}
