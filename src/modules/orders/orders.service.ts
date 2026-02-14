import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateOrderDto, UpdateOrderDto } from './dto';
import { ConfiguracoesService } from '../configuracoes/configuracoes.service';
import { QrCodePix } from 'qrcode-pix';

import { generateOrderCode } from '../../common/utils/string-utils';

@Injectable()
export class OrdersService {
    constructor(
        private prisma: PrismaService,
        private configuracoesService: ConfiguracoesService,
    ) { }

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

        // Check deadline
        const now = new Date();
        const deadline = new Date(dataEncomenda.dataLimitePedido);
        // Reset time part of deadline to end of day if needed, but assuming it's a full Date object from Prisma
        // If dataLimitePedido is stored as date only, we might need to adjust.
        // Assuming dataLimitePedido includes time or is treated as end of day.
        // Let's stick to strict comparison for now as per plan.
        if (now > deadline) {
            throw new BadRequestException('O prazo para pedidos nesta data já encerrou');
        }

        // Check if user already has an order for this order form
        const existingOrder = await this.prisma.pedidoEncomenda.findFirst({
            where: {
                usuarioId: userId,
                dataEncomendaId: dataEncomendaId,
                statusPagamento: { not: 'cancelado' } // Cancelled orders don't count
            }
        });

        if (existingOrder) {
            throw new BadRequestException('Você já possui um pedido para esta data de entrega. Edite o pedido existente ou cancele-o para criar um novo.');
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

        // Generate unique random code
        let codigo = '';
        let isUnique = false;
        while (!isUnique) {
            codigo = generateOrderCode(6);
            const existingCode = await this.prisma.pedidoEncomenda.findUnique({
                where: { codigo },
            });
            if (!existingCode) isUnique = true;
        }

        // Create order with transaction to ensure integrity
        const order = await this.prisma.$transaction(async (tx) => {
            const newOrder = await tx.pedidoEncomenda.create({
                data: {
                    usuarioId: userId,
                    dataEncomendaId: dataEncomendaId,
                    codigo: codigo,
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
        const orders = await this.prisma.pedidoEncomenda.findMany({
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

        const now = new Date();
        return Promise.all(orders.map(async (order) => {
            const deadline = new Date(order.dataEncomenda.dataLimitePedido);

            // Automatic UNLOCK: if blocked and deadline passed -> pendente
            if (order.statusPagamento === 'bloqueado' && now > deadline) {
                return this.prisma.pedidoEncomenda.update({
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
            }

            // Automatic LOCK: if pending (and not paid), special address, and deadline NOT passed -> bloqueado
            // This handles cases where deadline is extended or order was wrongly set to pending
            if (order.statusPagamento === 'pendente' && order.enderecoEspecialNome && now <= deadline) {
                return this.prisma.pedidoEncomenda.update({
                    where: { id: order.id },
                    data: { statusPagamento: 'bloqueado' },
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
            }

            return order;
        }));
    }

    async findOne(id: number, userId: string) {
        const order = await this.prisma.pedidoEncomenda.findUnique({
            where: { id },
            include: {
                dataEncomenda: true,
                usuario: true,
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

        // Automatic UNLOCK/LOCK Logic
        const now = new Date();
        const deadline = new Date(order.dataEncomenda.dataLimitePedido);

        // 1. UNLOCK: if blocked and deadline passed -> pendente
        if (order.statusPagamento === 'bloqueado' && now > deadline) {
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

        // 2. LOCK: if pending, special address, and deadline NOT passed -> bloqueado
        // This ensures orders revert to blocked if deadline is extended
        if (order.statusPagamento === 'pendente' && order.enderecoEspecialNome && now <= deadline) {
            const updatedOrder = await this.prisma.pedidoEncomenda.update({
                where: { id: order.id },
                data: { statusPagamento: 'bloqueado' },
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

        return order;
    }

    async update(id: number, userId: string, updateOrderDto: UpdateOrderDto) {
        const order = await this.prisma.pedidoEncomenda.findUnique({
            where: { id },
            include: {
                dataEncomenda: true,
                itens: true,
            },
        });

        if (!order) {
            throw new NotFoundException(`Pedido com ID ${id} não encontrado`);
        }

        // Check ownership
        if (order.usuarioId !== userId) {
            const user = await this.prisma.usuario.findUnique({ where: { id: userId } });
            if (user?.role !== 'admin') {
                throw new ForbiddenException('Você não tem permissão para editar este pedido');
            }
        }

        // Check if order can be edited (only pending or blocked status)
        if (!['pendente', 'bloqueado'].includes(order.statusPagamento)) {
            throw new BadRequestException('Apenas pedidos pendentes podem ser editados');
        }

        // Check deadline
        const now = new Date();
        const deadline = new Date(order.dataEncomenda.dataLimitePedido);
        if (now > deadline) {
            throw new BadRequestException('O prazo para edição deste pedido já expirou');
        }

        const { itens, ...orderData } = updateOrderDto;

        let totalValor = 0;
        let processedItens: any[] = [];

        // If items are being updated, recalculate everything
        if (itens && itens.length > 0) {
            // Calculate new total and validate products
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
                    precoUnitario: precoUnitario,
                };
            });

            processedItens = await Promise.all(itemPromises);

            // Update with new items using transaction
            const updatedOrder = await this.prisma.$transaction(async (tx) => {
                // Delete old items
                await tx.itemPedidoEncomenda.deleteMany({
                    where: { pedidoId: id },
                });

                // Determine new status based on special address
                let statusPagamento = order.statusPagamento;
                if (orderData.enderecoEspecialNome && order.statusPagamento === 'pendente') {
                    statusPagamento = 'bloqueado';
                } else if (!orderData.enderecoEspecialNome && order.statusPagamento === 'bloqueado') {
                    statusPagamento = 'pendente';
                }

                // Calculate delivery fee
                let taxaEntrega = 0;
                if (orderData.tipoEntrega === 'entrega' && !orderData.enderecoEspecialNome) {
                    if (totalValor < 100) taxaEntrega = 12;
                    else if (totalValor < 130) taxaEntrega = 8;
                    else taxaEntrega = 0;
                }

                // Update order
                const updated = await tx.pedidoEncomenda.update({
                    where: { id },
                    data: {
                        ...orderData,
                        totalValor: totalValor + taxaEntrega,
                        taxaEntrega,
                        statusPagamento,
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
                        dataEncomenda: true,
                        itens: {
                            include: {
                                produto: true,
                                variedade: true,
                            }
                        }
                    }
                });

                return updated;
            });

            // Recalculate shared fees if special address
            if (updatedOrder.enderecoEspecialNome) {
                await this.recalculateSharedFees(updatedOrder.dataEncomendaId, updatedOrder.enderecoEspecialNome);
                return this.findOne(updatedOrder.id, userId);
            }

            // If was special address before but not now, recalculate old group
            if (order.enderecoEspecialNome && !updatedOrder.enderecoEspecialNome) {
                await this.recalculateSharedFees(order.dataEncomendaId, order.enderecoEspecialNome);
            }

            return updatedOrder;
        } else {
            // Just update order data without changing items
            let taxaEntrega = Number(order.taxaEntrega);
            let statusPagamento = order.statusPagamento;

            // Handle status change based on special address
            if (orderData.enderecoEspecialNome !== undefined) {
                if (orderData.enderecoEspecialNome && order.statusPagamento === 'pendente') {
                    statusPagamento = 'bloqueado';
                } else if (!orderData.enderecoEspecialNome && order.statusPagamento === 'bloqueado') {
                    statusPagamento = 'pendente';
                }
            }

            const updatedOrder = await this.prisma.pedidoEncomenda.update({
                where: { id },
                data: {
                    ...orderData,
                    statusPagamento,
                },
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

            // Handle special address fee recalculation
            if (orderData.enderecoEspecialNome !== undefined) {
                if (updatedOrder.enderecoEspecialNome) {
                    await this.recalculateSharedFees(updatedOrder.dataEncomendaId, updatedOrder.enderecoEspecialNome);
                    return this.findOne(updatedOrder.id, userId);
                }
                if (order.enderecoEspecialNome && !updatedOrder.enderecoEspecialNome) {
                    await this.recalculateSharedFees(order.dataEncomendaId, order.enderecoEspecialNome);
                }
            }

            return updatedOrder;
        }
    }

    // Admin methods for payment management
    async confirmPayment(id: number, adminUserId: string) {
        const order = await this.prisma.pedidoEncomenda.findUnique({
            where: { id },
            include: { dataEncomenda: true }
        });

        if (!order) {
            throw new NotFoundException(`Pedido com ID ${id} não encontrado`);
        }

        if (order.statusPagamento === 'confirmado') {
            throw new BadRequestException('Este pedido já está confirmado');
        }

        if (order.statusPagamento === 'cancelado') {
            throw new BadRequestException('Não é possível confirmar um pedido cancelado');
        }

        const updatedOrder = await this.prisma.pedidoEncomenda.update({
            where: { id },
            data: {
                statusPagamento: 'confirmado',
                statusPagamentoAnterior: order.statusPagamento,
                dataPagamento: new Date(),
                confirmadoPor: adminUserId,
            },
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

    async revertPayment(id: number, adminUserId: string) {
        const order = await this.prisma.pedidoEncomenda.findUnique({
            where: { id },
        });

        if (!order) {
            throw new NotFoundException(`Pedido com ID ${id} não encontrado`);
        }

        if (order.statusPagamento !== 'confirmado') {
            throw new BadRequestException('Apenas pedidos confirmados podem ter o pagamento revertido');
        }

        const previousStatus = order.statusPagamentoAnterior || 'pendente';

        const updatedOrder = await this.prisma.pedidoEncomenda.update({
            where: { id },
            data: {
                statusPagamento: previousStatus,
                statusPagamentoAnterior: order.statusPagamento,
                dataPagamento: null,
            },
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

    async cancelOrder(id: number, adminUserId: string) {
        const order = await this.prisma.pedidoEncomenda.findUnique({
            where: { id },
        });

        if (!order) {
            throw new NotFoundException(`Pedido com ID ${id} não encontrado`);
        }

        if (order.statusPagamento === 'cancelado') {
            throw new BadRequestException('Este pedido já está cancelado');
        }

        const updatedOrder = await this.prisma.pedidoEncomenda.update({
            where: { id },
            data: {
                statusPagamento: 'cancelado',
                statusPagamentoAnterior: order.statusPagamento,
            },
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

        // Recalculate shared fees if this was a special address order
        if (order.enderecoEspecialNome) {
            await this.recalculateSharedFees(order.dataEncomendaId, order.enderecoEspecialNome);
        }

        return updatedOrder;
    }

    async revertCancellation(id: number, adminUserId: string) {
        const order = await this.prisma.pedidoEncomenda.findUnique({
            where: { id },
        });

        if (!order) {
            throw new NotFoundException(`Pedido com ID ${id} não encontrado`);
        }

        if (order.statusPagamento !== 'cancelado') {
            throw new BadRequestException('Este pedido não está cancelado');
        }

        const newStatus = order.statusPagamentoAnterior || 'pendente';

        const updatedOrder = await this.prisma.pedidoEncomenda.update({
            where: { id },
            data: {
                statusPagamento: newStatus,
                statusPagamentoAnterior: null,
            },
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

        // Recalculate shared fees if this was a special address order
        if (order.enderecoEspecialNome) {
            await this.recalculateSharedFees(order.dataEncomendaId, order.enderecoEspecialNome);
        }

        return updatedOrder;
    }

    // Admin: Get all orders for a specific order form
    async findByOrderForm(dataEncomendaId: number) {
        const orders = await this.prisma.pedidoEncomenda.findMany({
            where: { dataEncomendaId },
            orderBy: { dataPedido: 'desc' },
            include: {
                usuario: {
                    select: {
                        id: true,
                        nome: true,
                        telefone: true,
                        email: true,
                    }
                },
                dataEncomenda: true,
                itens: {
                    include: {
                        produto: true,
                        variedade: true,
                    }
                }
            },
        });

        return orders;
    }

    // Admin: Get summary of orders for a specific order form
    async getOrderFormSummary(dataEncomendaId: number) {
        const orders = await this.prisma.pedidoEncomenda.findMany({
            where: { dataEncomendaId },
            include: {
                usuario: {
                    select: {
                        id: true,
                        nome: true,
                        telefone: true,
                        email: true,
                    }
                },
                itens: {
                    include: {
                        produto: true,
                        variedade: true,
                    }
                }
            },
        });

        // Calculate totals
        const totalOrders = orders.length;
        const confirmedOrders = orders.filter(o => o.statusPagamento === 'confirmado').length;
        const pendingOrders = orders.filter(o => o.statusPagamento === 'pendente').length;
        const blockedOrders = orders.filter(o => o.statusPagamento === 'bloqueado').length;
        const cancelledOrders = orders.filter(o => o.statusPagamento === 'cancelado').length;

        const totalValue = orders
            .filter(o => o.statusPagamento !== 'cancelado')
            .reduce((sum, o) => sum + Number(o.totalValor), 0);

        const confirmedValue = orders
            .filter(o => o.statusPagamento === 'confirmado')
            .reduce((sum, o) => sum + Number(o.totalValor), 0);

        // Group products
        const productSummary: Record<string, { nome: any; variedadeNome: any; quantidade: number; total: number }> = {};

        orders
            .filter(o => o.statusPagamento !== 'cancelado')
            .forEach(order => {
                order.itens.forEach(item => {
                    const key = item.variedade
                        ? `${item.produtoId}-${item.variedade.id}`
                        : `${item.produtoId}`;

                    if (!productSummary[key]) {
                        productSummary[key] = {
                            nome: item.produto?.nome || null,
                            variedadeNome: item.variedade?.nome || null,
                            quantidade: 0,
                            total: 0,
                        };
                    }

                    productSummary[key].quantidade += item.quantidade;
                    productSummary[key].total += item.quantidade * Number(item.precoUnitario);
                });
            });

        return {
            totalOrders,
            confirmedOrders,
            pendingOrders,
            blockedOrders,
            cancelledOrders,
            totalValue,
            confirmedValue,
            products: Object.values(productSummary).sort((a, b) => b.quantidade - a.quantidade),
            orders,
        };
    }

    async getPixQrCode(id: number, userId: string) {
        const order = await this.prisma.pedidoEncomenda.findUnique({
            where: { id },
            include: {
                usuario: true,
            },
        });

        if (!order) throw new NotFoundException('Pedido não encontrado');

        // Allow admin access
        if (order.usuarioId !== userId) {
            const user = await this.prisma.usuario.findUnique({ where: { id: userId } });
            if (user?.role !== 'admin') {
                throw new ForbiddenException('Não autorizado');
            }
        }

        if (order.formaPagamento !== 'pix') throw new BadRequestException('Pedido não é do tipo PIX');

        const config = await this.configuracoesService.get();
        if (!config || !config.chavePix) {
            throw new BadRequestException('Configuração PIX não encontrada. Entre em contato com o suporte.');
        }

        const pix = QrCodePix({
            version: '01',
            key: config.chavePix,
            name: config.nomeRecebedor || 'Yatsunami',
            city: config.cidadeRecebedor || 'Curitiba',
            transactionId: `PAY${order.id}`,
            message: `Pedido #${order.id}`,
            value: Number(order.totalValor),
        });

        return {
            payload: pix.payload(),
            base64: await pix.base64(),
        };
    }
}
