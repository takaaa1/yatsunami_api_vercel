import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { SupabaseService } from '../../config/supabase.service';
import { randomUUID } from 'crypto';

import { Prisma } from '@prisma/client';

@Injectable()
export class ProductsService {
    constructor(
        private prisma: PrismaService,
        private supabaseService: SupabaseService,
    ) { }

    async create(createProductDto: CreateProductDto) {
        return this.prisma.produto.create({
            data: createProductDto as unknown as Prisma.ProdutoCreateInput,
        });
    }

    async findAll() {
        return this.prisma.produto.findMany({
            orderBy: {
                id: 'asc', // Changed sorting because categoria is now Json
            },
        });
    }

    async findOne(id: number) {
        const product = await this.prisma.produto.findUnique({
            where: { id },
        });

        if (!product) {
            throw new NotFoundException(`Product with ID ${id} not found`);
        }

        return product;
    }

    async update(id: number, updateProductDto: UpdateProductDto) {
        // Check if product exists
        await this.findOne(id);

        return this.prisma.produto.update({
            where: { id },
            data: updateProductDto as unknown as Prisma.ProdutoUpdateInput,
        });
    }

    async remove(id: number) {
        // Check if product exists
        await this.findOne(id);

        return this.prisma.produto.delete({
            where: { id },
        });
    }

    async uploadImage(file: Express.Multer.File): Promise<string> {
        const fileExt = file.originalname.split('.').pop();
        const fileName = `${randomUUID()}.${fileExt}`;
        const filePath = `products/${fileName}`;
        const bucket = 'public'; // Assuming 'public' bucket or 'products' bucket. Let's use 'products' if possible, or fall back to a known bucket.
        // Actually, let's use a meaningful bucket name. 'products' is good. if it doesn't exist, it might fail.
        // For now, I'll use 'products'.

        await this.supabaseService.uploadFile('products', filePath, file.buffer, file.mimetype);

        return this.supabaseService.getPublicUrl('products', filePath);
    }
}
