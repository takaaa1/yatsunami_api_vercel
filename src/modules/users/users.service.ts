import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma';

@Injectable()
export class UsersService {
    constructor(private prisma: PrismaService) { }

    async findAll(query?: string) {
        const where: any = {};

        if (query) {
            where.OR = [
                { nome: { contains: query, mode: 'insensitive' } },
                { email: { contains: query, mode: 'insensitive' } },
            ];
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
                criadoEm: true,
            }
        });
    }

    async findOne(id: string) {
        return this.prisma.usuario.findUnique({
            where: { id },
        });
    }
}
