import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateOrderFormDto, UpdateOrderFormDto } from './dto';

@Injectable()
export class OrderFormsService {
    constructor(private prisma: PrismaService) { }

    async create(createDto: CreateOrderFormDto) {
        return this.prisma.dataEncomenda.create({
            data: {
                dataEntrega: new Date(createDto.data_entrega),
                dataLimitePedido: new Date(createDto.data_limite_pedido),
                ativo: createDto.ativo ?? true,
                concluido: createDto.concluido ?? false,
                observacoes: createDto.observacoes,
            },
        });
    }

    async findAll() {
        return this.prisma.dataEncomenda.findMany({
            orderBy: {
                dataEntrega: 'desc',
            },
        });
    }

    async findOne(id: number) {
        const item = await this.prisma.dataEncomenda.findUnique({
            where: { id },
        });

        if (!item) {
            throw new NotFoundException(`Order form with ID ${id} not found`);
        }

        return item;
    }

    async update(id: number, updateDto: UpdateOrderFormDto) {
        await this.findOne(id); // Ensure it exists

        return this.prisma.dataEncomenda.update({
            where: { id },
            data: {
                ...(updateDto.data_entrega && { dataEntrega: new Date(updateDto.data_entrega) }),
                ...(updateDto.data_limite_pedido && { dataLimitePedido: new Date(updateDto.data_limite_pedido) }),
                ...(updateDto.ativo !== undefined && { ativo: updateDto.ativo }),
                ...(updateDto.concluido !== undefined && { concluido: updateDto.concluido }),
                ...(updateDto.observacoes !== undefined && { observacoes: updateDto.observacoes }),
            },
        });
    }

    async remove(id: number) {
        await this.findOne(id);
        return this.prisma.dataEncomenda.delete({
            where: { id },
        });
    }
}
