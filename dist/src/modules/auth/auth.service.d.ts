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
    changePassword(userId: number, changePasswordDto: ChangePasswordDto): Promise<{
        message: string;
    }>;
    getProfile(userId: number): Promise<{
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
        id: number;
        role: string;
        criadoEm: Date;
    }>;
    updateProfile(userId: number, updateData: UpdateProfileDto): Promise<{
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
        id: number;
        role: string;
    }>;
    uploadAvatar(userId: number, file: Express.Multer.File): Promise<{
        email: string;
        nome: string;
        avatarUrl: string | null;
        id: number;
    }>;
    validateRefreshToken(userId: number): Promise<string>;
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
