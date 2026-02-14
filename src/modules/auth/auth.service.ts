import {
    Injectable,
    UnauthorizedException,
    ConflictException,
    Logger,
    BadRequestException,
    InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
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

    constructor(
        private prisma: PrismaService,
        private configService: ConfigService,
        private mailService: MailService,
        private supabaseService: SupabaseService,
    ) { }

    async login(loginDto: LoginDto): Promise<AuthResponseDto> {
        const { email, password, rememberMe } = loginDto;
        const emailLower = email.toLowerCase().trim();

        // Authenticate via Supabase Auth
        const { data: authData, error: authError } =
            await this.supabaseService.getAdminClient().auth.signInWithPassword({
                email: emailLower,
                password,
            });

        if (authError || !authData.session) {
            this.logger.warn(`Login failed for: ${emailLower} - ${authError?.message}`);
            throw new UnauthorizedException('Credenciais inválidas');
        }

        // Fetch user profile from our table
        const user = await this.prisma.usuario.findUnique({
            where: { id: authData.user.id },
        });

        if (!user) {
            this.logger.warn(`User in auth.users but not in usuarios: ${emailLower}`);
            throw new UnauthorizedException('Credenciais inválidas');
        }

        this.logger.log(`User logged in: ${emailLower}`);

        return {
            accessToken: authData.session.access_token,
            refreshToken: authData.session.refresh_token,
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

        // Check if email already exists in our table
        const existingUser = await this.prisma.usuario.findUnique({
            where: { email: emailLower },
        });

        if (existingUser) {
            throw new ConflictException('Email já cadastrado');
        }

        // Create user in Supabase Auth
        const { data: authData, error: authError } =
            await this.supabaseService.getAdminClient().auth.admin.createUser({
                email: emailLower,
                password,
                email_confirm: true, // Auto-confirm email
            });

        if (authError || !authData.user) {
            this.logger.error(`Supabase Auth register failed: ${authError?.message}`);
            throw new InternalServerErrorException('Erro ao criar conta');
        }

        // Create user profile in our table with the Supabase Auth UUID
        const user = await this.prisma.usuario.create({
            data: {
                id: authData.user.id, // Use Supabase Auth UUID
                nome: nome.trim(),
                email: emailLower,
                telefone: telefone?.trim(),
                role: 'user',
                tema: tema as any,
                idioma: idioma as any,
            },
        });

        // Sign in to get a session token
        const { data: sessionData, error: sessionError } =
            await this.supabaseService.getAdminClient().auth.signInWithPassword({
                email: emailLower,
                password,
            });

        if (sessionError || !sessionData.session) {
            this.logger.error(`Post-register login failed: ${sessionError?.message}`);
            throw new InternalServerErrorException('Conta criada mas erro ao autenticar');
        }

        this.logger.log(`New user registered: ${emailLower}`);

        return {
            accessToken: sessionData.session.access_token,
            refreshToken: sessionData.session.refresh_token,
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

        if (!user) {
            throw new BadRequestException('Usuário não encontrado');
        }

        // Verify current password via Supabase Auth signIn
        const { error: verifyError } =
            await this.supabaseService.getAdminClient().auth.signInWithPassword({
                email: user.email,
                password: currentPassword,
            });

        if (verifyError) {
            throw new BadRequestException('Senha atual incorreta');
        }

        // Update password in Supabase Auth  
        const { error: updateError } =
            await this.supabaseService.getAdminClient().auth.admin.updateUserById(userId, {
                password: newPassword,
            });

        if (updateError) {
            this.logger.error(`Password update failed: ${updateError.message}`);
            throw new InternalServerErrorException('Erro ao alterar senha');
        }

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

        return user;
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

        // 3. Update password in Supabase Auth
        const { error: updateError } =
            await this.supabaseService.getAdminClient().auth.admin.updateUserById(user.id, {
                password: newPassword,
            });

        if (updateError) {
            this.logger.error(`Password reset failed in Supabase Auth: ${updateError.message}`);
            throw new InternalServerErrorException('Erro ao redefinir senha');
        }

        // 4. Delete used code (requested cleanup)
        await this.prisma.codigoRecuperacao.delete({
            where: { id: record.id },
        });

        this.logger.log(`Password successfully reset for: ${emailLower}`);

        return { message: 'Senha redefinida com sucesso' };
    }
}
