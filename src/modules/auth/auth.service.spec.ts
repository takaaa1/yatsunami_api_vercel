import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { PrismaService } from '../../prisma';
import { MailService } from '../../common/services/mail.service';
import { SupabaseService } from '../../config/supabase.service';

const mockUser = {
    id: 'uuid-1',
    nome: 'João Silva',
    email: 'joao@test.com',
    role: 'user',
    tema: 'system',
    idioma: 'pt-BR',
    ativo: true,
    avatarUrl: null,
};

const mockSession = {
    access_token: 'mock-access-token',
    refresh_token: 'mock-refresh-token',
};

const mockSignOut = jest.fn().mockResolvedValue({ error: null });
const mockSignInWithPassword = jest.fn();
const mockAdminDeleteUser = jest.fn().mockResolvedValue({ error: null });

const mockPrisma = {
    usuario: {
        findUnique: jest.fn(),
        update: jest.fn(),
    },
    codigoRecuperacao: {
        deleteMany: jest.fn(),
        create: jest.fn(),
        findFirst: jest.fn(),
        delete: jest.fn(),
    },
};

const mockSupabase = {
    getAdminClient: jest.fn().mockReturnValue({
        auth: {
            signInWithPassword: mockSignInWithPassword,
            admin: {
                createUser: jest.fn(),
                deleteUser: mockAdminDeleteUser,
                signOut: mockSignOut,
                updateUserById: jest.fn(),
            },
        },
    }),
    uploadFile: jest.fn(),
    getPublicUrl: jest.fn(),
    deleteFile: jest.fn(),
};

const mockMailService = {
    sendResetCode: jest.fn().mockResolvedValue(true),
};

const mockConfigService = {
    get: jest.fn().mockReturnValue(15),
};

describe('AuthService', () => {
    let service: AuthService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AuthService,
                { provide: PrismaService, useValue: mockPrisma },
                { provide: SupabaseService, useValue: mockSupabase },
                { provide: MailService, useValue: mockMailService },
                { provide: ConfigService, useValue: mockConfigService },
            ],
        }).compile();

        service = module.get<AuthService>(AuthService);
        jest.clearAllMocks();

        // Restore getAdminClient mock after clearAllMocks
        mockSupabase.getAdminClient.mockReturnValue({
            auth: {
                signInWithPassword: mockSignInWithPassword,
                admin: {
                    createUser: jest.fn(),
                    deleteUser: mockAdminDeleteUser,
                    signOut: mockSignOut,
                    updateUserById: jest.fn(),
                },
            },
        });
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('login', () => {
        it('deve retornar accessToken para usuário ativo', async () => {
            mockSignInWithPassword.mockResolvedValue({
                data: { session: mockSession, user: { id: 'uuid-1' } },
                error: null,
            });
            mockPrisma.usuario.findUnique.mockResolvedValue(mockUser);

            const result = await service.login({ email: 'joao@test.com', password: 'senha123' });

            expect(result.accessToken).toBe('mock-access-token');
            expect(result.user.id).toBe('uuid-1');
        });

        it('deve lançar UnauthorizedException para credenciais inválidas (Supabase rejeita)', async () => {
            mockSignInWithPassword.mockResolvedValue({
                data: { session: null, user: null },
                error: { message: 'Invalid credentials' },
            });

            await expect(
                service.login({ email: 'joao@test.com', password: 'errada' }),
            ).rejects.toThrow(UnauthorizedException);
        });

        it('deve lançar UnauthorizedException para usuário inativo', async () => {
            mockSignInWithPassword.mockResolvedValue({
                data: { session: mockSession, user: { id: 'uuid-1' } },
                error: null,
            });
            mockPrisma.usuario.findUnique.mockResolvedValue({ ...mockUser, ativo: false });

            await expect(
                service.login({ email: 'joao@test.com', password: 'senha123' }),
            ).rejects.toThrow(new UnauthorizedException('Conta desativada. Entre em contato com o suporte.'));
        });
    });

    describe('deactivateOwnAccount', () => {
        it('deve desativar a conta e revogar a sessão no Supabase', async () => {
            mockPrisma.usuario.findUnique.mockResolvedValue(mockUser);
            mockPrisma.usuario.update.mockResolvedValue({ ...mockUser, ativo: false });

            const result = await service.deactivateOwnAccount('uuid-1');

            expect(mockPrisma.usuario.update).toHaveBeenCalledWith({
                where: { id: 'uuid-1' },
                data: { ativo: false },
            });
            expect(mockSignOut).toHaveBeenCalledWith('uuid-1');
            expect(result.message).toBe('Conta desativada com sucesso');
        });

        it('deve lançar BadRequestException para usuário inexistente', async () => {
            mockPrisma.usuario.findUnique.mockResolvedValue(null);

            await expect(service.deactivateOwnAccount('nao-existe')).rejects.toThrow(
                BadRequestException,
            );
        });
    });
});
