import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma';
import { LoginDto, RegisterDto, ChangePasswordDto, AuthResponseDto } from './dto';
export declare class AuthService {
    private prisma;
    private jwtService;
    private configService;
    private readonly logger;
    private readonly SALT_ROUNDS;
    constructor(prisma: PrismaService, jwtService: JwtService, configService: ConfigService);
    login(loginDto: LoginDto): Promise<AuthResponseDto>;
    register(registerDto: RegisterDto): Promise<AuthResponseDto>;
    changePassword(userId: number, changePasswordDto: ChangePasswordDto): Promise<{
        message: string;
    }>;
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
    updateProfile(userId: number, updateData: Partial<{
        nome: string;
        telefone: string;
        tema: string;
        idioma: string;
        endereco: any;
        receberNotificacoes: boolean;
    }>): Promise<{
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
    validateRefreshToken(userId: number): Promise<string>;
}
