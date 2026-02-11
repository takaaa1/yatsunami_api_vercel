import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateOrderDto } from './dto';

@Injectable()
export class OrdersService {
    constructor(private prisma: PrismaService) { }

    async create(userId: string, createOrderDto: CreateOrderDto) {
        const { dataEncomendaId, itens, ...orderData } = createOrderDto;

        // Check if order date exists and is active
        const dataEncomenda = await this.prisma.dataEncomenda.findUnique({
            where: { id: dataEncomendaId },
        });

        if (!dataEncomenda) {
            throw new NotFoundException(`Data de encomenda com ID ${dataEncomendaId} não encontrada`);
        }

        if (!dataEncomenda.ativo) {
            throw new BadRequestException('Esta data de encomenda não está mais ativa');
        }

        // Calculate total value
        let totalValor = 0;

        // Verify products and varieties, calculate prices
        const itemPromises = itens.map(async (item) => {
            const produto = await this.prisma.produto.findUnique({
                where: { id: item.produtoId },
                include: { variedades: true },
            });

            if (!produto) {
                throw new NotFoundException(`Produto com ID ${item.produtoId} não encontrado`);
            }

            let precoUnitario = produto.preco ? Number(produto.preco) : 0;
            let variedadeId = item.variedadeId;

            if (variedadeId) {
                const variedade = produto.variedades.find(v => v.id === variedadeId);
                if (!variedade) {
                    throw new NotFoundException(`Variedade com ID ${variedadeId} não encontrada para o produto ${item.produtoId}`);
                }
                precoUnitario = Number(variedade.preco);
            }

            totalValor += precoUnitario * item.quantidade;

            return {
                produtoId: item.produtoId,
                variedadeId: item.variedadeId,
                quantidade: item.quantidade,
                precoUnitario: precoUnitario, // Store historical price
            };
        });

        const processedItens = await Promise.all(itemPromises);

        // Add delivery fee to total
        totalValor += Number(orderData.taxaEntrega || 0);

        // Create order with transaction to ensure integrity
        return this.prisma.$transaction(async (tx) => {
            const order = await tx.pedidoEncomenda.create({
                data: {
                    usuarioId: userId,
                    dataEncomendaId: dataEncomendaId,
                    ...orderData,
                    totalValor: totalValor,
                    statusPagamento: 'pendente',
                    itens: {
                        create: processedItens.map(item => ({
                            produtoId: item.produtoId,
                            variedadeId: item.variedadeId,
                            quantidade: item.quantidade,
                            precoUnitario: item.precoUnitario,
                        })),
                    },
                },
                include: {
                    itens: {
                        include: {
                            produto: true,
                            variedade: true,
                        }
                    }
                }
            });

            return order;
        });
    }

    async findAll(userId: string) {
        return this.prisma.pedidoEncomenda.findMany({
            where: { usuarioId: userId },
            orderBy: { dataPedido: 'desc' },
            include: {
                dataEncomenda: true,
                itens: {
                    include: {
                        produto: true,
                        variedade: true,
                    }
                }
            },
        });
    }

    async findOne(id: number, userId: string) {
        const order = await this.prisma.pedidoEncomenda.findUnique({
            where: { id },
            include: {
                dataEncomenda: true,
                itens: {
                    include: {
                        produto: true,
                        variedade: true,
                    }
                }
            },
        });

        if (!order) {
            throw new NotFoundException(`Pedido com ID ${id} não encontrado`);
        }

        // Ensure user owns the order (or is admin - implementing basic owner check for now)
        // TODO: Add admin check logic if needed
        if (order.usuarioId !== userId) {
            // Find if user is admin
            const user = await this.prisma.usuario.findUnique({ where: { id: userId } });
            if (user?.role !== 'admin') {
                throw new NotFoundException(`Pedido com ID ${id} não encontrado`); // Don't leak existence
            }
        }

        return order;
    }
}
