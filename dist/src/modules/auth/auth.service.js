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
let AuthService = AuthService_1 = class AuthService {
    prisma;
    jwtService;
    configService;
    logger = new common_1.Logger(AuthService_1.name);
    SALT_ROUNDS = 12;
    constructor(prisma, jwtService, configService) {
        this.prisma = prisma;
        this.jwtService = jwtService;
        this.configService = configService;
    }
    async login(loginDto) {
        const { email, password } = loginDto;
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
        const accessToken = this.jwtService.sign(payload);
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
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = AuthService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_1.PrismaService,
        jwt_1.JwtService,
        config_1.ConfigService])
], AuthService);
//# sourceMappingURL=auth.service.js.map