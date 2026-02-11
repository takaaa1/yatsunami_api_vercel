import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateOrderFormDto, UpdateOrderFormDto } from './dto';

@Injectable()
export class OrderFormsService {
    constructor(private prisma: PrismaService) { }

    private mapToSnakeCase(item: any) {
        return {
            id: item.id,
            data_entrega: item.dataEntrega ? item.dataEntrega.toISOString().split('T')[0] : null,
            data_limite_pedido: item.dataLimitePedido,
            ativo: item.ativo,
            concluido: item.concluido,
            observacoes: item.observacoes,
            criado_em: item.criadoEm,
        };
    }

    async create(createDto: CreateOrderFormDto) {
        const item = await this.prisma.dataEncomenda.create({
            data: {
                dataEntrega: new Date(createDto.data_entrega),
                dataLimitePedido: new Date(createDto.data_limite_pedido),
                ativo: createDto.ativo ?? true,
                concluido: createDto.concluido ?? false,
                observacoes: createDto.observacoes,
            },
        });

        if (createDto.selections && createDto.selections.length > 0) {
            await this.prisma.produtoEncomenda.createMany({
                data: createDto.selections.map(s => ({
                    dataEncomendaId: item.id,
                    produtoId: s.product_id,
                    variedadeId: s.variedade_id || null,
                })),
            });
        }

        return this.findOne(item.id);
    }

    async findAll() {
        const items = await this.prisma.dataEncomenda.findMany({
            orderBy: {
                dataEntrega: 'desc',
            },
        });
        return items.map(item => this.mapToSnakeCase(item));
    }

    async findLatest() {
        const item = await this.prisma.dataEncomenda.findFirst({
            orderBy: {
                criadoEm: 'desc',
            },
            include: {
                produtosEncomenda: true,
            },
        });

        if (!item) return null;
        return this.mapToSnakeCase(item);
    }

    async findOne(id: number) {
        const item = await this.prisma.dataEncomenda.findUnique({
            where: { id },
            include: {
                produtosEncomenda: true,
            },
        });

        if (!item) {
            throw new NotFoundException(`Order form with ID ${id} not found`);
        }

        const mapped = this.mapToSnakeCase(item);
        return {
            ...mapped,
            selections: item.produtosEncomenda.map(p => ({
                product_id: p.produtoId,
                variedade_id: p.variedadeId,
            })),
        };
    }

    async update(id: number, updateDto: UpdateOrderFormDto) {
        await this.findOne(id); // Ensure it exists

        const item = await this.prisma.dataEncomenda.update({
            where: { id },
            data: {
                ...(updateDto.data_entrega && { dataEntrega: new Date(updateDto.data_entrega) }),
                ...(updateDto.data_limite_pedido && { dataLimitePedido: new Date(updateDto.data_limite_pedido) }),
                ...(updateDto.ativo !== undefined && { ativo: updateDto.ativo }),
                ...(updateDto.concluido !== undefined && { concluido: updateDto.concluido }),
                ...(updateDto.observacoes !== undefined && { observacoes: updateDto.observacoes }),
            },
        });

        if (updateDto.selections) {
            // Simple sync: delete existing and recreate
            await this.prisma.produtoEncomenda.deleteMany({
                where: { dataEncomendaId: id },
            });

            if (updateDto.selections.length > 0) {
                await this.prisma.produtoEncomenda.createMany({
                    data: updateDto.selections.map(s => ({
                        dataEncomendaId: id,
                        produtoId: s.product_id,
                        variedadeId: s.variedade_id || null,
                    })),
                });
            }
        }

        return this.findOne(id);
    }

    async remove(id: number) {
        await this.findOne(id);
        return this.prisma.dataEncomenda.delete({
            where: { id },
        });
    }
}
