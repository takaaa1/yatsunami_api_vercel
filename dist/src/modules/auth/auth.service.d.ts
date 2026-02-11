import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma';
import { LoginDto, RegisterDto, ChangePasswordDto, ForgotPasswordDto, VerifyCodeDto, ResetPasswordDto, UpdateProfileDto, AuthResponseDto } from './dto';
import { MailService } from '../../common/services/mail.service';
import { SupabaseService } from '../../config/supabase.service';
export declare class AuthService {
    private prisma;
    private jwtService;
    private configService;
    private mailService;
    private supabaseService;
    private readonly logger;
    private readonly SALT_ROUNDS;
    constructor(prisma: PrismaService, jwtService: JwtService, configService: ConfigService, mailService: MailService, supabaseService: SupabaseService);
    login(loginDto: LoginDto): Promise<AuthResponseDto>;
    register(registerDto: RegisterDto): Promise<AuthResponseDto>;
    changePassword(userId: string, changePasswordDto: ChangePasswordDto): Promise<{
        message: string;
    }>;
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
    uploadAvatar(userId: string, file: Express.Multer.File): Promise<{
        email: string;
        id: string;
        nome: string;
        avatarUrl: string | null;
    }>;
    validateRefreshToken(userId: string): Promise<string>;
    forgotPassword(forgotPasswordDto: ForgotPasswordDto): Promise<{
        message: string;
    }>;
    verifyResetCode(verifyCodeDto: VerifyCodeDto): Promise<{
        valid: boolean;
    }>;
    resetPassword(resetPasswordDto: ResetPasswordDto): Promise<{
        message: string;
    }>;
}
