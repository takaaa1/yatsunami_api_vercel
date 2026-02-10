import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

import { Prisma } from '@prisma/client';

@Injectable()
export class CategoriesService {
    constructor(private prisma: PrismaService) { }

    async create(createCategoryDto: CreateCategoryDto) {
        // Find current max order
        const maxOrder = await this.prisma.categoria.aggregate({
            _max: { ordem: true }
        });

        const nextOrder = (maxOrder._max.ordem || 0) + 1;

        return this.prisma.categoria.create({
            data: {
                ...createCategoryDto,
                ordem: nextOrder
            } as unknown as Prisma.CategoriaCreateInput,
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
        // Check if category exists
        await this.findOne(id);

        return this.prisma.$transaction(async (tx) => {
            // Delete the category
            const deleted = await tx.categoria.delete({
                where: { id },
            });

            // Get all remaining categories, ordered by current order
            const remaining = await tx.categoria.findMany({
                orderBy: { ordem: 'asc' },
            });

            // Rebalance orders: 1, 2, 3...
            for (let i = 0; i < remaining.length; i++) {
                await tx.categoria.update({
                    where: { id: remaining[i].id },
                    data: { ordem: i + 1 },
                });
            }

            return deleted;
        });
    }

    async reorder(ids: number[]) {
        return this.prisma.$transaction(
            ids.map((id, index) =>
                this.prisma.categoria.update({
                    where: { id },
                    data: { ordem: index + 1 },
                })
            )
        );
    }
}

