import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma';
import { SupabaseService } from '../../config/supabase.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserFilterDto } from './dto/user-filter.dto';

@Injectable()
export class UsersService {
    constructor(
        private prisma: PrismaService,
        private supabaseService: SupabaseService,
    ) { }

    private static readonly EXCLUDED_EMAIL_PATTERN = '@deleted.yatsunami';

    async findAll(filter?: UserFilterDto, skip = 0, take = 10) {
        const conditions: any[] = [];

        if (filter?.search) {
            conditions.push({
                OR: [
                    { nome: { contains: filter.search, mode: 'insensitive' } },
                    { email: { contains: filter.search, mode: 'insensitive' } },
                ],
            });
        }

        if (filter?.role !== undefined) {
            conditions.push({ role: filter.role });
        }

        if (filter?.ativo !== undefined) {
            conditions.push({ ativo: filter.ativo });
        }

        // Usuários excluídos: exibidos SOMENTE quando excluido=true; caso contrário, ocultá-los
        if (filter?.excluido === true) {
            conditions.push({ email: { endsWith: UsersService.EXCLUDED_EMAIL_PATTERN } });
        } else {
            conditions.push({ email: { not: { endsWith: UsersService.EXCLUDED_EMAIL_PATTERN } } });
        }

        const where = { AND: conditions };

        return this.prisma.usuario.findMany({
            where,
            orderBy: { nome: 'asc' },
            skip,
            take,
            select: {
                id: true,
                nome: true,
                email: true,
                telefone: true,
                role: true,
                ativo: true,
                criadoEm: true,
                avatarUrl: true,
            },
        });
    }

    async findOne(id: string) {
        const user = await this.prisma.usuario.findUnique({
            where: { id },
            select: {
                id: true,
                nome: true,
                email: true,
                telefone: true,
                cpfCnpj: true,
                observacoes: true,
                role: true,
                tema: true,
                idioma: true,
                endereco: true,
                receberNotificacoes: true,
                ativo: true,
                criadoEm: true,
                atualizadoEm: true,
                avatarUrl: true,
            },
        });

        if (!user) {
            throw new NotFoundException('Usuário não encontrado');
        }

        return user;
    }

    async update(id: string, dto: UpdateUserDto) {
        await this.findOne(id);

        return this.prisma.usuario.update({
            where: { id },
            data: dto,
            select: {
                id: true,
                nome: true,
                email: true,
                telefone: true,
                cpfCnpj: true,
                observacoes: true,
                role: true,
                tema: true,
                idioma: true,
                endereco: true,
                receberNotificacoes: true,
                ativo: true,
                criadoEm: true,
                atualizadoEm: true,
                avatarUrl: true,
            },
        });
    }

    async activate(id: string) {
        await this.findOne(id);

        return this.prisma.usuario.update({
            where: { id },
            data: { ativo: true },
            select: { id: true, nome: true, email: true, ativo: true },
        });
    }

    async deactivate(id: string, currentUserId: string) {
        if (id === currentUserId) {
            throw new ForbiddenException('Você não pode desativar sua própria conta por aqui.');
        }
        await this.findOne(id);

        return this.prisma.usuario.update({
            where: { id },
            data: { ativo: false },
            select: { id: true, nome: true, email: true, ativo: true },
        });
    }

    async remove(id: string, currentUserId: string) {
        if (id === currentUserId) {
            throw new ForbiddenException('Você não pode excluir sua própria conta.');
        }
        await this.findOne(id);

        const user = await this.prisma.usuario.findUnique({ where: { id }, select: { nome: true } });

        // Anonymize user record instead of deleting — preserves FK integrity for orders/sales
        await this.prisma.usuario.update({
            where: { id },
            data: {
                nome: `${user!.nome} (Usuário Excluído)`,
                email: `deleted_${id}@deleted.yatsunami`,
                telefone: null,
                endereco: [],
                avatarUrl: null,
                expoPushToken: null,
                ativo: false,
            },
        });

        // Remove user from Supabase Auth (id is also the auth UUID)
        await this.supabaseService.getAdminClient().auth.admin.deleteUser(id);
    }

    async updatePushToken(id: string, token: string) {
        return this.prisma.usuario.update({
            where: { id },
            data: { expoPushToken: token },
        });
    }
}
