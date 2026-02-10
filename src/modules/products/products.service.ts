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
        const { variedades, ...productData } = createProductDto;

        const data: Prisma.ProdutoCreateInput = {
            nome: productData.nome as any,
            preco: productData.preco,
            ingredientes: productData.ingredientes as any,
            categoria: productData.categoria as any,
            observacoes: productData.observacoes as any,
            imagem: productData.imagem,
            abreviacao: productData.abreviacao,
            ativo: productData.ativo,
            variedades: variedades ? {
                create: variedades.map(v => ({
                    nome: v.nome as any,
                    preco: v.preco,
                    ativo: v.ativo
                }))
            } : undefined
        };

        return this.prisma.produto.create({
            data,
            include: {
                variedades: true
            }
        });
    }

    private async deleteOldImage(imageUrl: string | null | undefined) {
        if (!imageUrl) return;

        try {
            // Extract path from URL: .../storage/v1/object/public/products/FILE_PATH
            const parts = imageUrl.split('/products/');
            if (parts.length > 1) {
                const filePath = parts[1];
                await this.supabaseService.deleteFile('products', [filePath]);
            }
        } catch (error) {
            // Log but don't fail the main operation if cleanup fails
            console.warn(`Failed to delete old product image: ${error.message}`);
        }
    }

    async findAll() {
        return this.prisma.produto.findMany({
            include: {
                variedades: true
            },
            orderBy: {
                id: 'asc',
            },
        });
    }

    async findOne(id: number) {
        const product = await this.prisma.produto.findUnique({
            where: { id },
            include: {
                variedades: true
            }
        });

        if (!product) {
            throw new NotFoundException(`Product with ID ${id} not found`);
        }

        return product;
    }

    async update(id: number, updateProductDto: UpdateProductDto) {
        const product = await this.findOne(id);
        const { variedades, ...productData } = updateProductDto;

        // If updating image, delete old one
        if (updateProductDto.imagem && product.imagem && updateProductDto.imagem !== product.imagem) {
            await this.deleteOldImage(product.imagem);
        }

        const data: Prisma.ProdutoUpdateInput = {
            nome: productData.nome as any,
            preco: productData.preco,
            ingredientes: productData.ingredientes as any,
            categoria: productData.categoria as any,
            observacoes: productData.observacoes as any,
            imagem: productData.imagem,
            abreviacao: productData.abreviacao,
            ativo: productData.ativo,
            variedades: variedades ? {
                deleteMany: {}, // Simpler to recreate
                create: variedades.map(v => ({
                    nome: v.nome as any,
                    preco: v.preco,
                    ativo: v.ativo
                }))
            } : undefined
        };

        return this.prisma.produto.update({
            where: { id },
            data,
            include: {
                variedades: true
            }
        });
    }

    async remove(id: number) {
        const product = await this.findOne(id);

        // Delete image from storage
        if (product.imagem) {
            await this.deleteOldImage(product.imagem);
        }

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
