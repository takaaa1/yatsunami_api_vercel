import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma';
import { LoginDto, RegisterDto, ChangePasswordDto, ForgotPasswordDto, VerifyCodeDto, ResetPasswordDto, AuthResponseDto } from './dto';
import { MailService } from '../../common/services/mail.service';
export declare class AuthService {
    private prisma;
    private jwtService;
    private configService;
    private mailService;
    private readonly logger;
    private readonly SALT_ROUNDS;
    constructor(prisma: PrismaService, jwtService: JwtService, configService: ConfigService, mailService: MailService);
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
        endereco: import("@prisma/client/runtime/library").JsonValue;
        receberNotificacoes: boolean;
        id: number;
        role: string;
        cpfCnpj: string | null;
        criadoEm: Date;
    }>;
    updateProfile(userId: number, updateData: Partial<{
        nome: string;
        telefone: string;
        tema: string;
        idioma: string;
        endereco: any;
        receberNotificacoes: boolean;
    }>): Promise<{
        email: string;
        nome: string;
        telefone: string | null;
        tema: string;
        idioma: string;
        endereco: import("@prisma/client/runtime/library").JsonValue;
        receberNotificacoes: boolean;
        id: number;
        role: string;
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
