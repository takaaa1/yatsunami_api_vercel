import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateExpressOrderDto } from './dto/create-express-order.dto';
import { generateOrderCode } from '../../common/utils/string-utils';

import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class ExpressOrdersService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) { }

  async checkStatus(userId: string) {
    const client = await this.prisma.clientePedidoDireto.findUnique({
      where: { usuarioId: userId },
    });
    return { enabled: !!client?.habilitado };
  }

  async create(userId: string, dto: CreateExpressOrderDto) {
    // Check if user is enabled
    const client = await this.prisma.clientePedidoDireto.findUnique({
      where: { usuarioId: userId },
    });

    if (!client || !client.habilitado) {
      throw new ForbiddenException('User is not enabled for express orders');
    }

    // Calculate totals and validate products
    let totalValor = 0;
    const itemsData: any[] = [];

    for (const item of dto.itens) {
      const product = await this.prisma.produto.findUnique({
        where: { id: item.produtoId },
        include: { variedades: true },
      });

      if (!product) {
        throw new NotFoundException(`Product ${item.produtoId} not found`);
      }

      let price = Number(product.preco);
      let variety: typeof product.variedades[0] | null | undefined = null;

      // Validate availability based on product or variety
      if (item.variedadeId) {
        variety = product.variedades.find((v) => v.id === item.variedadeId);
        if (!variety) {
          throw new NotFoundException(`Variety ${item.variedadeId} not found`);
        }

        const varietyEnabled = await this.prisma.variedadePedidoDireto.findFirst({
          where: { variedadeId: item.variedadeId, habilitado: true },
        });
        if (!varietyEnabled) {
          const vName = (variety.nome as any)?.['pt-BR'] || (variety.nome as any)?.['ja-JP'] || 'Variety';
          throw new BadRequestException(`Variety ${vName} is not available for express orders`);
        }
        price = Number(variety.preco);
      } else {
        const productEnabled = await this.prisma.produtoPedidoDireto.findFirst({
          where: { produtoId: item.produtoId, habilitado: true },
        });
        if (!productEnabled) {
          const name = (product.nome as any)?.['pt-BR'] || (product.nome as any)?.['ja-JP'] || 'Product';
          throw new BadRequestException(`Product ${name} is not available for express orders`);
        }
      }

      const subtotal = price * item.quantidade;
      totalValor += subtotal;

      itemsData.push({
        produtoId: item.produtoId,
        variedadeId: item.variedadeId,
        quantidade: item.quantidade,
        precoUnitario: price,
        subtotal: subtotal,
      });
    }

    if (totalValor < 60) {
      throw new BadRequestException('Minimum order value is R$ 60,00');
    }

    // Generate unique random code
    let codigo = '';
    let isUnique = false;
    while (!isUnique) {
      codigo = generateOrderCode(6);
      const existingCode = await this.prisma.pedidoDireto.findUnique({
        where: { codigo },
      });
      if (!existingCode) isUnique = true;
    }

    // Create order
    const order = await this.prisma.pedidoDireto.create({
      data: {
        usuarioId: userId,
        codigo: codigo,
        observacoes: dto.observacoes,
        totalValor: totalValor,
        status: 'pendente',
        dataEntrega: dto.dataEntrega ? new Date(dto.dataEntrega) : new Date(),
        itens: {
          create: itemsData,
        },
      },
      include: {
        usuario: { select: { id: true, nome: true } },
        itens: true,
      },
    });

    // Notificar administradores sobre o novo pedido expresso
    try {
      const admins = await this.prisma.usuario.findMany({
        where: { role: 'admin' },
        select: { id: true }
      });

      if (admins.length > 0) {
        await this.notificationsService.broadcastNotification({
          usuarioIds: admins.map(a => a.id),
          titulo: '🚀 Novo Pedido Expresso',
          mensagem: `O usuário ${order.usuario.nome} realizou um novo pedido expresso (#${order.codigo}).`,
        });
      }
    } catch (error) {
      console.error('Erro ao notificar admins sobre pedido expresso:', error);
    }

    return order;
  }

  async findAll(status?: string) {
    const where = status ? { status } : {};
    return this.prisma.pedidoDireto.findMany({
      where,
      include: {
        usuario: { select: { id: true, nome: true, email: true } },
        itens: {
          include: {
            produto: { select: { nome: true } },
            variedade: { select: { nome: true } },
          },
        },
      },
      orderBy: { dataPedido: 'desc' },
    });
  }

  async findMyOrders(userId: string) {
    return this.prisma.pedidoDireto.findMany({
      where: { usuarioId: userId },
      include: {
        itens: {
          include: {
            produto: { select: { nome: true } },
            variedade: { select: { nome: true } },
          },
        },
      },
      orderBy: { dataPedido: 'desc' },
    });
  }

  async findOne(id: number, user: any) {
    const order = await this.prisma.pedidoDireto.findUnique({
      where: { id },
      include: {
        usuario: { select: { id: true, nome: true, email: true, telefone: true, endereco: true } },
        itens: {
          include: {
            produto: { select: { nome: true } },
            variedade: { select: { nome: true } },
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (user.role !== 'admin' && order.usuarioId !== user.id) {
      throw new ForbiddenException('Access denied');
    }

    return order;
  }

  async updateStatus(id: number, status: string, observacoes?: string) {
    const data: any = { status };

    // Update timestamps and user fields based on status
    // Note: In a real app, we might want to track WHO confirmed/delivered
    // For now, we just update the timestamps consistently

    if (status === 'confirmado') {
      data.confirmadoEm = new Date();
      data.entregueEm = null; // Clear forward stamps
    } else if (status === 'entregue') {
      data.entregueEm = new Date();
    } else if (status === 'pendente') {
      data.confirmadoEm = null;
      data.entregueEm = null;
    }

    // Logic for reverting timestamps if moving backwards could be added here
    // but typically express orders move forward.

    const updatedOrder = await this.prisma.pedidoDireto.update({
      where: { id },
      data,
      include: {
        usuario: { select: { id: true, nome: true } }
      }
    });

    // Notificar o usuário sobre a mudança de status
    try {
      let titulo = 'Status do Pedido Atualizado';
      let mensagem = `Seu pedido #${updatedOrder.codigo} mudou para: ${status}.`;

      if (status === 'confirmado') {
        titulo = 'Pedido Confirmado';
        mensagem = `Seu pedido #${updatedOrder.codigo} foi confirmado!`;
      } else if (status === 'entregue') {
        titulo = 'Pedido Entregue';
        mensagem = `Seu pedido #${updatedOrder.codigo} foi entregue. Bom apetite!`;
      }

      await this.notificationsService.createAndSendNotification({
        usuarioId: updatedOrder.usuarioId,
        titulo: titulo,
        mensagem: mensagem,
      });
    } catch (error) {
      console.error('Erro ao notificar usuário sobre status do pedido express:', error);
    }

    return updatedOrder;
  }

  async cancelOrder(id: number, userId: string) {
    const order = await this.prisma.pedidoDireto.findUnique({
      where: { id },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.usuarioId !== userId) {
      throw new ForbiddenException('You can only cancel your own orders');
    }

    if (order.status !== 'pendente') {
      throw new BadRequestException('Only pending orders can be cancelled');
    }

    return this.prisma.pedidoDireto.update({
      where: { id },
      data: { status: 'cancelado' },
    });
  }

  async findAllClients() {
    return this.prisma.usuario.findMany({
      select: {
        id: true,
        nome: true,
        email: true,
        role: true,
        clientePedidoDireto: {
          select: { habilitado: true },
        },
      },
      orderBy: { nome: 'asc' },
    });
  }

  async toggleClient(userId: string, habilitado: boolean) {
    return this.prisma.clientePedidoDireto.upsert({
      where: { usuarioId: userId },
      update: { habilitado },
      create: {
        usuarioId: userId,
        habilitado,
      },
    });
  }

  async findAllProducts() {
    const products = await this.prisma.produto.findMany({
      where: { ativo: true },
      include: {
        produtosPedidoDireto: {
          select: { habilitado: true },
        },
        variedades: {
          include: {
            variedadesPedidoDireto: {
              select: { habilitado: true }
            }
          },
          orderBy: { id: 'asc' }
        },
      },
    });

    return products.sort((a, b) => {
      const catOrderA = (a.categoria as any)?.ordem || 999;
      const catOrderB = (b.categoria as any)?.ordem || 999;

      if (catOrderA !== catOrderB) {
        return catOrderA - catOrderB;
      }

      const nameA = (a.nome as any)?.['pt-BR'] || (a.nome as any)?.['ja-JP'] || '';
      const nameB = (b.nome as any)?.['pt-BR'] || (b.nome as any)?.['ja-JP'] || '';
      return nameA.localeCompare(nameB);
    });
  }

  async toggleProduct(produtoId: number, habilitado: boolean) {
    // Check if relation exists first
    const existing = await this.prisma.produtoPedidoDireto.findFirst({
      where: { produtoId }
    });

    if (existing) {
      return this.prisma.produtoPedidoDireto.update({
        where: { id: existing.id },
        data: { habilitado }
      });
    } else {
      return this.prisma.produtoPedidoDireto.create({
        data: {
          produtoId,
          habilitado
        }
      });
    }
  }
  async toggleVariety(variedadeId: number, habilitado: boolean) {
    // Check if relation exists first
    const existing = await this.prisma.variedadePedidoDireto.findUnique({
      where: { variedadeId }
    });

    if (existing) {
      return this.prisma.variedadePedidoDireto.update({
        where: { id: existing.id },
        data: { habilitado }
      });
    } else {
      return this.prisma.variedadePedidoDireto.create({
        data: {
          variedadeId,
          habilitado
        }
      });
    }
  }
}
