import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service';
import { PrismaService } from '../../prisma';
import { SupabaseService } from '../../config/supabase.service';

const mockUser = {
    id: 'uuid-1',
    nome: 'João Silva',
    email: 'joao@test.com',
    telefone: null,
    cpfCnpj: null,
    observacoes: null,
    role: 'user',
    tema: 'system',
    idioma: 'pt-BR',
    endereco: [],
    receberNotificacoes: true,
    ativo: true,
    criadoEm: new Date(),
    atualizadoEm: new Date(),
    avatarUrl: null,
};

const mockPrisma = {
    usuario: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
    },
};

const mockSupabase = {
    getAdminClient: jest.fn().mockReturnValue({
        auth: {
            admin: {
                deleteUser: jest.fn().mockResolvedValue({ error: null }),
            },
        },
    }),
};

describe('UsersService', () => {
    let service: UsersService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                UsersService,
                { provide: PrismaService, useValue: mockPrisma },
                { provide: SupabaseService, useValue: mockSupabase },
            ],
        }).compile();

        service = module.get<UsersService>(UsersService);
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('findAll', () => {
        it('deve retornar todos os usuários sem filtro', async () => {
            mockPrisma.usuario.findMany.mockResolvedValue([mockUser]);
            const result = await service.findAll();
            expect(result).toEqual([mockUser]);
            expect(mockPrisma.usuario.findMany).toHaveBeenCalledWith(
                expect.objectContaining({ where: {} }),
            );
        });

        it('deve filtrar por search', async () => {
            mockPrisma.usuario.findMany.mockResolvedValue([mockUser]);
            await service.findAll({ search: 'João' });
            expect(mockPrisma.usuario.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { OR: expect.any(Array) },
                }),
            );
        });

        it('deve filtrar por role', async () => {
            mockPrisma.usuario.findMany.mockResolvedValue([]);
            await service.findAll({ role: 'admin' });
            expect(mockPrisma.usuario.findMany).toHaveBeenCalledWith(
                expect.objectContaining({ where: { role: 'admin' } }),
            );
        });

        it('deve filtrar por ativo=false', async () => {
            mockPrisma.usuario.findMany.mockResolvedValue([]);
            await service.findAll({ ativo: false });
            expect(mockPrisma.usuario.findMany).toHaveBeenCalledWith(
                expect.objectContaining({ where: { ativo: false } }),
            );
        });
    });

    describe('findOne', () => {
        it('deve retornar o usuário encontrado', async () => {
            mockPrisma.usuario.findUnique.mockResolvedValue(mockUser);
            const result = await service.findOne('uuid-1');
            expect(result).toEqual(mockUser);
        });

        it('deve lançar NotFoundException para ID inexistente', async () => {
            mockPrisma.usuario.findUnique.mockResolvedValue(null);
            await expect(service.findOne('nao-existe')).rejects.toThrow(NotFoundException);
        });
    });

    describe('update', () => {
        it('deve atualizar o usuário', async () => {
            mockPrisma.usuario.findUnique.mockResolvedValue(mockUser);
            mockPrisma.usuario.update.mockResolvedValue({ ...mockUser, nome: 'Novo Nome' });
            const result = await service.update('uuid-1', { nome: 'Novo Nome' });
            expect(result.nome).toBe('Novo Nome');
        });
    });

    describe('activate', () => {
        it('deve ativar o usuário (ativo=true)', async () => {
            mockPrisma.usuario.findUnique.mockResolvedValue({ ...mockUser, ativo: false });
            mockPrisma.usuario.update.mockResolvedValue({ id: 'uuid-1', nome: mockUser.nome, email: mockUser.email, ativo: true });
            const result = await service.activate('uuid-1');
            expect(result.ativo).toBe(true);
            expect(mockPrisma.usuario.update).toHaveBeenCalledWith(
                expect.objectContaining({ data: { ativo: true } }),
            );
        });
    });

    describe('deactivate', () => {
        it('deve desativar o usuário (ativo=false)', async () => {
            mockPrisma.usuario.findUnique.mockResolvedValue(mockUser);
            mockPrisma.usuario.update.mockResolvedValue({ id: 'uuid-1', nome: mockUser.nome, email: mockUser.email, ativo: false });
            const result = await service.deactivate('uuid-1');
            expect(result.ativo).toBe(false);
            expect(mockPrisma.usuario.update).toHaveBeenCalledWith(
                expect.objectContaining({ data: { ativo: false } }),
            );
        });
    });

    describe('remove', () => {
        it('deve excluir o usuário e remover do Supabase Auth', async () => {
            mockPrisma.usuario.findUnique.mockResolvedValue(mockUser);
            mockPrisma.usuario.delete.mockResolvedValue(mockUser);
            await service.remove('uuid-1');
            expect(mockPrisma.usuario.delete).toHaveBeenCalledWith({ where: { id: 'uuid-1' } });
            expect(mockSupabase.getAdminClient().auth.admin.deleteUser).toHaveBeenCalledWith('uuid-1');
        });

        it('deve lançar NotFoundException ao tentar excluir usuário inexistente', async () => {
            mockPrisma.usuario.findUnique.mockResolvedValue(null);
            await expect(service.remove('nao-existe')).rejects.toThrow(NotFoundException);
        });
    });
});
