import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

import { Prisma } from '@prisma/client';

@Injectable()
export class CategoriesService {
    constructor(private prisma: PrismaService) { }

    async create(createCategoryDto: CreateCategoryDto) {
        const ordem =
            createCategoryDto.ordem ??
            (await this.prisma.categoria
                .aggregate({ _max: { ordem: true } })
                .then((r) => (r._max.ordem ?? 0) + 1));
        return this.prisma.categoria.create({
            data: {
                ...(createCategoryDto as unknown as Prisma.CategoriaCreateInput),
                ordem,
            },
        });
    }

    async findAll() {
        return this.prisma.categoria.findMany({
            orderBy: {
                ordem: 'asc',
            },
        });
    }

    async findOne(id: number) {
        const category = await this.prisma.categoria.findUnique({
            where: { id },
        });

        if (!category) {
            throw new NotFoundException(`Category with ID ${id} not found`);
        }

        return category;
    }

    async update(id: number, updateCategoryDto: UpdateCategoryDto) {
        // Check if category exists
        await this.findOne(id);

        return this.prisma.categoria.update({
            where: { id },
            data: updateCategoryDto as unknown as Prisma.CategoriaUpdateInput,
        });
    }

    async remove(id: number) {
        await this.findOne(id);
        await this.prisma.categoria.delete({
            where: { id },
        });
        // Reordenar: 1, 2, 3, ...
        const all = await this.prisma.categoria.findMany({
            orderBy: { ordem: 'asc' },
            select: { id: true },
        });
        await this.prisma.$transaction(
            all.map((c, i) =>
                this.prisma.categoria.update({
                    where: { id: c.id },
                    data: { ordem: i + 1 },
                })
            )
        );
        return { deleted: id };
    }
}
