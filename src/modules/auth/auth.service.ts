import {
    Injectable,
    UnauthorizedException,
    ConflictException,
    Logger,
    BadRequestException,
    InternalServerErrorException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma';
import {
    LoginDto,
    RegisterDto,
    ChangePasswordDto,
    ForgotPasswordDto,
    VerifyCodeDto,
    ResetPasswordDto,
    AuthResponseDto,
} from './dto';
import { MailService } from '../../common/services/mail.service';

@Injectable()
export class AuthService {
    private readonly logger = new Logger(AuthService.name);
    private readonly SALT_ROUNDS = 12;

    constructor(
        private prisma: PrismaService,
        private jwtService: JwtService,
        private configService: ConfigService,
        private mailService: MailService,
    ) { }

    async login(loginDto: LoginDto): Promise<AuthResponseDto> {
        const { email, password, rememberMe } = loginDto;

        // Find user by email
        const user = await this.prisma.usuario.findUnique({
            where: { email: email.toLowerCase().trim() },
        });

        if (!user) {
            this.logger.warn(`Login attempt for non-existent email: ${email}`);
            throw new UnauthorizedException('Credenciais inválidas');
        }

        if (!user.senhaHash) {
            this.logger.warn(`User ${email} has no password set`);
            throw new UnauthorizedException('Credenciais inválidas');
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(password, user.senhaHash);

        if (!isPasswordValid) {
            this.logger.warn(`Invalid password attempt for: ${email}`);
            throw new UnauthorizedException('Credenciais inválidas');
        }

        // Generate JWT token with conditional expiration
        const payload = {
            sub: user.id,
            email: user.email,
            role: user.role,
        };

        const expiresIn = rememberMe ? '30d' : '7d';
        const accessToken = this.jwtService.sign(payload, { expiresIn });

        this.logger.log(`User logged in: ${email}`);

        return {
            accessToken,
            user: {
                id: user.id,
                nome: user.nome,
                email: user.email,
                role: user.role,
                tema: user.tema,
                idioma: user.idioma,
            },
        };
    }

    async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
        const { email, password, nome, telefone, tema, idioma } = registerDto;
        const emailLower = email.toLowerCase().trim();

        // Check if email already exists
        const existingUser = await this.prisma.usuario.findUnique({
            where: { email: emailLower },
        });

        if (existingUser) {
            throw new ConflictException('Email já cadastrado');
        }

        // Hash password
        const senhaHash = await bcrypt.hash(password, this.SALT_ROUNDS);

        // Create user
        const user = await this.prisma.usuario.create({
            data: {
                nome: nome.trim(),
                email: emailLower,
                senhaHash,
                telefone: telefone?.trim(),
                role: 'user',
                tema: tema as any,
                idioma: idioma as any,
            },
        });

        // Generate JWT token
        const payload = {
            sub: user.id,
            email: user.email,
            role: user.role,
        };

        const accessToken = this.jwtService.sign(payload);

        this.logger.log(`New user registered: ${email}`);

        return {
            accessToken,
            user: {
                id: user.id,
                nome: user.nome,
                email: user.email,
                role: user.role,
                tema: user.tema,
                idioma: user.idioma,
            },
        };
    }

    async changePassword(
        userId: number,
        changePasswordDto: ChangePasswordDto,
    ): Promise<{ message: string }> {
        const { currentPassword, newPassword } = changePasswordDto;

        const user = await this.prisma.usuario.findUnique({
            where: { id: userId },
        });

        if (!user || !user.senhaHash) {
            throw new BadRequestException('Usuário não encontrado');
        }

        // Verify current password
        const isValidPassword = await bcrypt.compare(currentPassword, user.senhaHash);

        if (!isValidPassword) {
            throw new BadRequestException('Senha atual incorreta');
        }

        // Hash new password
        const newSenhaHash = await bcrypt.hash(newPassword, this.SALT_ROUNDS);

        // Update password
        await this.prisma.usuario.update({
            where: { id: userId },
            data: { senhaHash: newSenhaHash },
        });

        this.logger.log(`Password changed for user: ${user.email}`);

        return { message: 'Senha alterada com sucesso' };
    }

    async getProfile(userId: number) {
        const user = await this.prisma.usuario.findUnique({
            where: { id: userId },
            select: {
                id: true,
                nome: true,
                email: true,
                telefone: true,
                cpfCnpj: true,
                role: true,
                tema: true,
                idioma: true,
                endereco: true,
                receberNotificacoes: true,
                criadoEm: true,
                observacoes: true,
            },
        });

        if (!user) {
            throw new BadRequestException('Usuário não encontrado');
        }

        return user;
    }

    async updateProfile(userId: number, updateData: Partial<{
        nome: string;
        telefone: string;
        tema: string;
        idioma: string;
        endereco: any;
        receberNotificacoes: boolean;
        cpfCnpj: string;
        observacoes: string;
    }>) {
        const user = await this.prisma.usuario.update({
            where: { id: userId },
            data: updateData,
            select: {
                id: true,
                nome: true,
                email: true,
                telefone: true,
                role: true,
                tema: true,
                idioma: true,
                endereco: true,
                receberNotificacoes: true,
                cpfCnpj: true,
                observacoes: true,
            },
        });

        return user;
    }

    async validateRefreshToken(userId: number): Promise<string> {
        const user = await this.prisma.usuario.findUnique({
            where: { id: userId },
        });

        if (!user) {
            throw new UnauthorizedException('Usuário não encontrado');
        }

        const payload = {
            sub: user.id,
            email: user.email,
            role: user.role,
        };

        return this.jwtService.sign(payload);
    }

    async forgotPassword(forgotPasswordDto: ForgotPasswordDto): Promise<{ message: string }> {
        const { email } = forgotPasswordDto;
        const emailLower = email.toLowerCase().trim();

        // 1. Check user (but don't fail if not found to prevent enumeration)
        const user = await this.prisma.usuario.findUnique({
            where: { email: emailLower },
        });

        // 2. Generate 6 digit code
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        const expirationMinutes = this.configService.get<number>('auth.resetPasswordExpirationMinutes', 15);
        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + expirationMinutes);

        // 3. Cleanup: remove old codes for this user (requested) and all generic expired ones
        await this.prisma.codigoRecuperacao.deleteMany({
            where: {
                OR: [
                    { email: emailLower },
                    { expiraEm: { lt: new Date() } }
                ]
            },
        });

        // 4. Save new code
        await this.prisma.codigoRecuperacao.create({
            data: {
                email: emailLower,
                codigo: code,
                expiraEm: expiresAt,
            },
        });

        // 5. Send email if user exists
        if (user) {
            const emailSent = await this.mailService.sendResetCode(
                user.email,
                code,
                user.nome,
                user.idioma
            );
            if (emailSent) {
                this.logger.log(`Reset code sent to: ${emailLower}`);
            } else {
                this.logger.error(`Failed to send reset code email to: ${emailLower}`);
                throw new InternalServerErrorException('Erro ao enviar email de recuperação. Tente novamente mais tarde.');
            }
        } else {
            this.logger.warn(`Reset requested for non-existent email: ${emailLower}`);
        }

        return { message: 'Se o e-mail estiver cadastrado, você receberá um código' };
    }

    async verifyResetCode(verifyCodeDto: VerifyCodeDto): Promise<{ valid: boolean }> {
        const { email, codigo } = verifyCodeDto;
        const emailLower = email.toLowerCase().trim();

        const record = await this.prisma.codigoRecuperacao.findFirst({
            where: {
                email: emailLower,
                codigo,
                expiraEm: { gt: new Date() },
            },
        });

        if (!record) {
            throw new BadRequestException('Código inválido ou expirado');
        }

        return { valid: true };
    }

    async resetPassword(resetPasswordDto: ResetPasswordDto): Promise<{ message: string }> {
        const { email, codigo, newPassword } = resetPasswordDto;
        const emailLower = email.toLowerCase().trim();

        // 1. Verify code again
        const record = await this.prisma.codigoRecuperacao.findFirst({
            where: {
                email: emailLower,
                codigo,
                expiraEm: { gt: new Date() },
            },
        });

        if (!record) {
            throw new BadRequestException('Código inválido ou expirado');
        }

        // 2. Find user
        const user = await this.prisma.usuario.findUnique({
            where: { email: emailLower },
        });

        if (!user) {
            throw new BadRequestException('Usuário não encontrado');
        }

        // 3. Update password
        const senhaHash = await bcrypt.hash(newPassword, this.SALT_ROUNDS);
        await this.prisma.usuario.update({
            where: { id: user.id },
            data: { senhaHash },
        });

        // 4. Delete used code (requested cleanup)
        await this.prisma.codigoRecuperacao.delete({
            where: { id: record.id },
        });

        this.logger.log(`Password successfully reset for: ${emailLower}`);

        return { message: 'Senha redefinida com sucesso' };
    }
}
