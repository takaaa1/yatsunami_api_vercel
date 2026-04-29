import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service';
import { PrismaService } from '../../prisma';

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

describe('UsersService', () => {
    let service: UsersService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                UsersService,
                { provide: PrismaService, useValue: mockPrisma },
            ],
        }).compile();

        service = module.get<UsersService>(UsersService);
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('findAll', () => {
        it('deve retornar todos os usuários sem filtro (exclui contas anonimizadas)', async () => {
            mockPrisma.usuario.findMany.mockResolvedValue([mockUser]);
            const result = await service.findAll();
            expect(result).toEqual([mockUser]);
            expect(mockPrisma.usuario.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: {
                        AND: [{ email: { not: { endsWith: '@deleted.yatsunami' } } }],
                    },
                }),
            );
        });

        it('deve filtrar por search', async () => {
            mockPrisma.usuario.findMany.mockResolvedValue([mockUser]);
            await service.findAll({ search: 'João' });
            expect(mockPrisma.usuario.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: {
                        AND: expect.arrayContaining([
                            {
                                OR: [
                                    { nome: { contains: 'João', mode: 'insensitive' } },
                                    { email: { contains: 'João', mode: 'insensitive' } },
                                ],
                            },
                            { email: { not: { endsWith: '@deleted.yatsunami' } } },
                        ]),
                    },
                }),
            );
        });

        it('deve filtrar por role', async () => {
            mockPrisma.usuario.findMany.mockResolvedValue([]);
            await service.findAll({ role: 'admin' });
            expect(mockPrisma.usuario.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: {
                        AND: expect.arrayContaining([{ role: 'admin' }]),
                    },
                }),
            );
        });

        it('deve filtrar por ativo=false', async () => {
            mockPrisma.usuario.findMany.mockResolvedValue([]);
            await service.findAll({ ativo: false });
            expect(mockPrisma.usuario.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: {
                        AND: expect.arrayContaining([{ ativo: false }]),
                    },
                }),
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
            const result = await service.deactivate('uuid-1', 'admin-id');
            expect(result.ativo).toBe(false);
            expect(mockPrisma.usuario.update).toHaveBeenCalledWith(
                expect.objectContaining({ data: { ativo: false } }),
            );
        });
    });

    describe('remove', () => {
        it('deve anonimizar o usuário (update, sem delete físico)', async () => {
            mockPrisma.usuario.findUnique.mockResolvedValue(mockUser);
            mockPrisma.usuario.update.mockResolvedValue({ ...mockUser, ativo: false });
            await service.remove('uuid-1', 'admin-id');
            expect(mockPrisma.usuario.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { id: 'uuid-1' },
                    data: expect.objectContaining({
                        email: expect.stringContaining('deleted_'),
                        ativo: false,
                    }),
                }),
            );
        });

        it('deve lançar NotFoundException ao tentar excluir usuário inexistente', async () => {
            mockPrisma.usuario.findUnique.mockResolvedValue(null);
            await expect(service.remove('nao-existe', 'admin-id')).rejects.toThrow(NotFoundException);
        });
    });
});
