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
    UpdateProfileDto,
    AuthResponseDto,
} from './dto';
import { MailService } from '../../common/services/mail.service';
import { SupabaseService } from '../../config/supabase.service';

@Injectable()
export class AuthService {
    private readonly logger = new Logger(AuthService.name);
    private readonly SALT_ROUNDS = 12;

    constructor(
        private prisma: PrismaService,
        private jwtService: JwtService,
        private configService: ConfigService,
        private mailService: MailService,
        private supabaseService: SupabaseService,
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
                avatarUrl: user.avatarUrl,
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
                avatarUrl: user.avatarUrl,
            },
        };
    }

    async changePassword(
        userId: string,
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

    async getProfile(userId: string) {
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
                avatarUrl: true,
            },
        });

        if (!user) {
            throw new BadRequestException('Usuário não encontrado');
        }

        return user;
    }

    async updateProfile(userId: string, updateData: UpdateProfileDto, file?: Express.Multer.File) {
        // Handle Avatar Upload if file is present
        if (file) {
            // 1. Get current user to check for existing avatar
            const currentUser = await this.prisma.usuario.findUnique({
                where: { id: userId },
                select: { avatarUrl: true },
            });

            const fileExt = file.originalname.split('.').pop();
            const fileName = `${userId}_${Date.now()}.${fileExt}`;
            const filePath = `avatars/${fileName}`;

            // 2. Upload to Supabase
            await this.supabaseService.uploadFile('avatars', filePath, file.buffer, file.mimetype);

            // 3. Get Public URL
            const avatarUrl = this.supabaseService.getPublicUrl('avatars', filePath);

            // 4. Update DTO with new URL
            updateData.avatarUrl = avatarUrl;

            // 5. Delete old avatar if exists (cleanup)
            if (currentUser?.avatarUrl) {
                try {
                    const oldUrl = currentUser.avatarUrl;
                    const parts = oldUrl.split('/avatars/');
                    if (parts.length > 1) {
                        const oldFilePath = parts[1];
                        if (oldFilePath !== filePath) {
                            await this.supabaseService.deleteFile('avatars', [oldFilePath]);
                            this.logger.log(`Old avatar deleted: ${oldFilePath}`);
                        }
                    }
                } catch (error) {
                    this.logger.warn(`Failed to delete old avatar: ${error.message}`);
                }
            }
        }

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
                avatarUrl: true,
            },
        });

        return user;
    }

    async uploadAvatar(userId: string, file: Express.Multer.File) {
        // 1. Get current user to check for existing avatar
        const currentUser = await this.prisma.usuario.findUnique({
            where: { id: userId },
            select: { avatarUrl: true },
        });

        const fileExt = file.originalname.split('.').pop();
        const fileName = `${userId}_${Date.now()}.${fileExt}`;
        const filePath = `avatars/${fileName}`;

        // 2. Upload to Supabase
        await this.supabaseService.uploadFile('avatars', filePath, file.buffer, file.mimetype);

        // 3. Get Public URL
        const avatarUrl = this.supabaseService.getPublicUrl('avatars', filePath);

        // 4. Update User in DB
        const user = await this.prisma.usuario.update({
            where: { id: userId },
            data: { avatarUrl },
            select: {
                id: true,
                nome: true,
                email: true,
                avatarUrl: true,
            },
        });

        // 5. Delete old avatar if exists and different (cleanup)
        if (currentUser?.avatarUrl) {
            try {
                const oldUrl = currentUser.avatarUrl;
                // Extract path from URL: .../storage/v1/object/public/avatars/FILE_PATH
                // Or simply verify if it contains 'avatars/' and get the part after it
                const parts = oldUrl.split('/avatars/');
                if (parts.length > 1) {
                    const oldFilePath = parts[1];
                    // Verify if it is not the same file (unlikely due to timestamp)
                    if (oldFilePath !== filePath) {
                        await this.supabaseService.deleteFile('avatars', [oldFilePath]);
                        this.logger.log(`Old avatar deleted: ${oldFilePath}`);
                    }
                }
            } catch (error) {
                // Log but don't fail the request if cleanup fails
                this.logger.warn(`Failed to delete old avatar: ${error.message}`);
            }
        }

        return user;
    }

    async validateRefreshToken(userId: string): Promise<string> {
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
