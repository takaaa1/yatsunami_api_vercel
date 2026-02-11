import { AuthService } from './auth.service';
import { LoginDto, RegisterDto, ChangePasswordDto, UpdateProfileDto, ForgotPasswordDto, VerifyCodeDto, ResetPasswordDto, AuthResponseDto } from './dto';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    login(loginDto: LoginDto): Promise<AuthResponseDto>;
    register(registerDto: RegisterDto): Promise<AuthResponseDto>;
    getProfile(userId: string): Promise<{
        email: string;
        nome: string;
        telefone: string | null;
        tema: string;
        idioma: string;
        cpfCnpj: string | null;
        observacoes: string | null;
        endereco: import("@prisma/client/runtime/library").JsonValue;
        receberNotificacoes: boolean;
        avatarUrl: string | null;
        id: string;
        role: string;
        criadoEm: Date;
    }>;
    updateProfile(userId: string, updateData: UpdateProfileDto, file?: Express.Multer.File): Promise<{
        email: string;
        nome: string;
        telefone: string | null;
        tema: string;
        idioma: string;
        cpfCnpj: string | null;
        observacoes: string | null;
        endereco: import("@prisma/client/runtime/library").JsonValue;
        receberNotificacoes: boolean;
        avatarUrl: string | null;
        id: string;
        role: string;
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
        nome: string;
        avatarUrl: string | null;
        id: string;
    }>;
}
