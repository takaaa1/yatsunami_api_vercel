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

        // Initial status
        let statusPagamento = 'pendente';
        if (orderData.enderecoEspecialNome) {
            statusPagamento = 'bloqueado';
        }

        // Create order with transaction to ensure integrity
        const order = await this.prisma.$transaction(async (tx) => {
            const newOrder = await tx.pedidoEncomenda.create({
                data: {
                    usuarioId: userId,
                    dataEncomendaId: dataEncomendaId,
                    ...orderData,
                    totalValor: totalValor,
                    statusPagamento: statusPagamento,
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

            return newOrder;
        });

        // If it's a special address, recalculate fees for everyone there
        if (order.enderecoEspecialNome) {
            await this.recalculateSharedFees(order.dataEncomendaId, order.enderecoEspecialNome);
            // Reload order after recalculation
            return this.findOne(order.id, userId);
        }

        return order;
    }

    async recalculateSharedFees(dataEncomendaId: number, specialAddressName: string) {
        // Find all orders for this form and special address that are not yet finalized (paid/cancelled)
        const orders = await this.prisma.pedidoEncomenda.findMany({
            where: {
                dataEncomendaId,
                enderecoEspecialNome: specialAddressName,
                statusPagamento: { in: ['bloqueado', 'pendente'] }
            }
        });

        if (orders.length === 0) return;

        // Calculate total subtotal
        let totalSubtotal = 0;
        orders.forEach(order => {
            const subtotal = Number(order.totalValor) - Number(order.taxaEntrega);
            totalSubtotal += subtotal;
        });

        // Tiered Fee:
        // Total < 100: R$ 12
        // Total < 130: R$ 8
        // Total >= 130: Grátis
        let totalFee = 0;
        if (totalSubtotal < 100) {
            totalFee = 12;
        } else if (totalSubtotal < 130) {
            totalFee = 8;
        } else {
            totalFee = 0;
        }

        // Divide fee equally
        const sharedFee = totalFee / orders.length;

        // Update all orders
        await this.prisma.$transaction(
            orders.map(order => {
                const subtotal = Number(order.totalValor) - Number(order.taxaEntrega);
                const newTotal = subtotal + sharedFee;
                return this.prisma.pedidoEncomenda.update({
                    where: { id: order.id },
                    data: {
                        taxaEntrega: sharedFee,
                        totalValor: newTotal
                    }
                });
            })
        );
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

        // Automatic unlock logic: if blocked and deadline passed, move to pending
        if (order.statusPagamento === 'bloqueado') {
            const now = new Date();
            const deadline = new Date(order.dataEncomenda.dataLimitePedido);
            if (now > deadline) {
                const updatedOrder = await this.prisma.pedidoEncomenda.update({
                    where: { id: order.id },
                    data: { statusPagamento: 'pendente' },
                    include: {
                        dataEncomenda: true,
                        itens: {
                            include: {
                                produto: true,
                                variedade: true,
                            }
                        }
                    }
                });
                return updatedOrder;
            }
        }

        return order;
    }
}
