import { Injectable, NotFoundException } from '@nestjs/common';
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

    async findAll(filter?: UserFilterDto) {
        const where: any = {};

        if (filter?.search) {
            where.OR = [
                { nome: { contains: filter.search, mode: 'insensitive' } },
                { email: { contains: filter.search, mode: 'insensitive' } },
            ];
        }

        if (filter?.role !== undefined) {
            where.role = filter.role;
        }

        if (filter?.ativo !== undefined) {
            where.ativo = filter.ativo;
        }

        return this.prisma.usuario.findMany({
            where,
            orderBy: { nome: 'asc' },
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

    async deactivate(id: string) {
        await this.findOne(id);

        return this.prisma.usuario.update({
            where: { id },
            data: { ativo: false },
            select: { id: true, nome: true, email: true, ativo: true },
        });
    }

    async remove(id: string) {
        await this.findOne(id);

        await this.prisma.usuario.delete({ where: { id } });

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
