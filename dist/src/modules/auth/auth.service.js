"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var AuthService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const bcrypt = __importStar(require("bcrypt"));
const prisma_1 = require("../../prisma");
const mail_service_1 = require("../../common/services/mail.service");
const supabase_service_1 = require("../../config/supabase.service");
let AuthService = AuthService_1 = class AuthService {
    prisma;
    jwtService;
    configService;
    mailService;
    supabaseService;
    logger = new common_1.Logger(AuthService_1.name);
    SALT_ROUNDS = 12;
    constructor(prisma, jwtService, configService, mailService, supabaseService) {
        this.prisma = prisma;
        this.jwtService = jwtService;
        this.configService = configService;
        this.mailService = mailService;
        this.supabaseService = supabaseService;
    }
    async login(loginDto) {
        const { email, password, rememberMe } = loginDto;
        const user = await this.prisma.usuario.findUnique({
            where: { email: email.toLowerCase().trim() },
        });
        if (!user) {
            this.logger.warn(`Login attempt for non-existent email: ${email}`);
            throw new common_1.UnauthorizedException('Credenciais inválidas');
        }
        if (!user.senhaHash) {
            this.logger.warn(`User ${email} has no password set`);
            throw new common_1.UnauthorizedException('Credenciais inválidas');
        }
        const isPasswordValid = await bcrypt.compare(password, user.senhaHash);
        if (!isPasswordValid) {
            this.logger.warn(`Invalid password attempt for: ${email}`);
            throw new common_1.UnauthorizedException('Credenciais inválidas');
        }
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
    async register(registerDto) {
        const { email, password, nome, telefone, tema, idioma } = registerDto;
        const emailLower = email.toLowerCase().trim();
        const existingUser = await this.prisma.usuario.findUnique({
            where: { email: emailLower },
        });
        if (existingUser) {
            throw new common_1.ConflictException('Email já cadastrado');
        }
        const senhaHash = await bcrypt.hash(password, this.SALT_ROUNDS);
        const user = await this.prisma.usuario.create({
            data: {
                nome: nome.trim(),
                email: emailLower,
                senhaHash,
                telefone: telefone?.trim(),
                role: 'user',
                tema: tema,
                idioma: idioma,
            },
        });
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
    async changePassword(userId, changePasswordDto) {
        const { currentPassword, newPassword } = changePasswordDto;
        const user = await this.prisma.usuario.findUnique({
            where: { id: userId },
        });
        if (!user || !user.senhaHash) {
            throw new common_1.BadRequestException('Usuário não encontrado');
        }
        const isValidPassword = await bcrypt.compare(currentPassword, user.senhaHash);
        if (!isValidPassword) {
            throw new common_1.BadRequestException('Senha atual incorreta');
        }
        const newSenhaHash = await bcrypt.hash(newPassword, this.SALT_ROUNDS);
        await this.prisma.usuario.update({
            where: { id: userId },
            data: { senhaHash: newSenhaHash },
        });
        this.logger.log(`Password changed for user: ${user.email}`);
        return { message: 'Senha alterada com sucesso' };
    }
    async getProfile(userId) {
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
            throw new common_1.BadRequestException('Usuário não encontrado');
        }
        return user;
    }
    async updateProfile(userId, updateData) {
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
    async uploadAvatar(userId, file) {
        const fileExt = file.originalname.split('.').pop();
        const fileName = `${userId}_${Date.now()}.${fileExt}`;
        const filePath = `avatars/${fileName}`;
        await this.supabaseService.uploadFile('avatars', filePath, file.buffer, file.mimetype);
        const avatarUrl = this.supabaseService.getPublicUrl('avatars', filePath);
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
        return user;
    }
    async validateRefreshToken(userId) {
        const user = await this.prisma.usuario.findUnique({
            where: { id: userId },
        });
        if (!user) {
            throw new common_1.UnauthorizedException('Usuário não encontrado');
        }
        const payload = {
            sub: user.id,
            email: user.email,
            role: user.role,
        };
        return this.jwtService.sign(payload);
    }
    async forgotPassword(forgotPasswordDto) {
        const { email } = forgotPasswordDto;
        const emailLower = email.toLowerCase().trim();
        const user = await this.prisma.usuario.findUnique({
            where: { email: emailLower },
        });
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        const expirationMinutes = this.configService.get('auth.resetPasswordExpirationMinutes', 15);
        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + expirationMinutes);
        await this.prisma.codigoRecuperacao.deleteMany({
            where: {
                OR: [
                    { email: emailLower },
                    { expiraEm: { lt: new Date() } }
                ]
            },
        });
        await this.prisma.codigoRecuperacao.create({
            data: {
                email: emailLower,
                codigo: code,
                expiraEm: expiresAt,
            },
        });
        if (user) {
            const emailSent = await this.mailService.sendResetCode(user.email, code, user.nome, user.idioma);
            if (emailSent) {
                this.logger.log(`Reset code sent to: ${emailLower}`);
            }
            else {
                this.logger.error(`Failed to send reset code email to: ${emailLower}`);
                throw new common_1.InternalServerErrorException('Erro ao enviar email de recuperação. Tente novamente mais tarde.');
            }
        }
        else {
            this.logger.warn(`Reset requested for non-existent email: ${emailLower}`);
        }
        return { message: 'Se o e-mail estiver cadastrado, você receberá um código' };
    }
    async verifyResetCode(verifyCodeDto) {
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
            throw new common_1.BadRequestException('Código inválido ou expirado');
        }
        return { valid: true };
    }
    async resetPassword(resetPasswordDto) {
        const { email, codigo, newPassword } = resetPasswordDto;
        const emailLower = email.toLowerCase().trim();
        const record = await this.prisma.codigoRecuperacao.findFirst({
            where: {
                email: emailLower,
                codigo,
                expiraEm: { gt: new Date() },
            },
        });
        if (!record) {
            throw new common_1.BadRequestException('Código inválido ou expirado');
        }
        const user = await this.prisma.usuario.findUnique({
            where: { email: emailLower },
        });
        if (!user) {
            throw new common_1.BadRequestException('Usuário não encontrado');
        }
        const senhaHash = await bcrypt.hash(newPassword, this.SALT_ROUNDS);
        await this.prisma.usuario.update({
            where: { id: user.id },
            data: { senhaHash },
        });
        await this.prisma.codigoRecuperacao.delete({
            where: { id: record.id },
        });
        this.logger.log(`Password successfully reset for: ${emailLower}`);
        return { message: 'Senha redefinida com sucesso' };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = AuthService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_1.PrismaService,
        jwt_1.JwtService,
        config_1.ConfigService,
        mail_service_1.MailService,
        supabase_service_1.SupabaseService])
], AuthService);
//# sourceMappingURL=auth.service.js.map