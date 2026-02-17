import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class DashboardService {
    constructor(private prisma: PrismaService) { }

    async getAdminDashboard() {
        // 1. Total Vendas
        const totalVendas = await this.prisma.venda.aggregate({
            _sum: {
                total: true,
            },
        });

        // 2. Total Despesas
        const totalDespesas = await this.prisma.notaDespesa.aggregate({
            _sum: {
                valorTotal: true,
            },
        });

        // 3. Vendas por mês (últimos 6 meses)
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        const vendasPorMes = await this.prisma.venda.groupBy({
            by: ['data'],
            where: {
                data: {
                    gte: sixMonthsAgo,
                },
            },
            _sum: {
                total: true,
            },
        });

        // Formatando vendasPorMes para agrupar por mês/ano
        const formattedVendas = this.groupByMonth(vendasPorMes, 'data', 'total');

        // 4. Despesas por mês (últimos 6 meses)
        const despesasPorMes = await this.prisma.notaDespesa.groupBy({
            by: ['dataCompra'],
            where: {
                dataCompra: {
                    gte: sixMonthsAgo,
                },
            },
            _sum: {
                valorTotal: true,
            },
        });

        const formattedDespesas = this.groupByMonth(despesasPorMes, 'dataCompra', 'valorTotal');

        // 5. Contagem de Pedidos Pendentes
        const pedidosPendentes = await this.prisma.pedidoEncomenda.count({
            where: {
                statusPagamento: 'pendente',
            },
        });

        const pedidosDiretosPendentes = await this.prisma.pedidoDireto.count({
            where: {
                status: 'pendente',
            },
        });

        return {
            summary: {
                totalReceita: totalVendas._sum.total || 0,
                totalDespesas: totalDespesas._sum.valorTotal || 0,
                lucroLiquido: (Number(totalVendas._sum.total) || 0) - (Number(totalDespesas._sum.valorTotal) || 0),
                pedidosPendentes: pedidosPendentes + pedidosDiretosPendentes,
            },
            charts: {
                vendas: formattedVendas,
                despesas: formattedDespesas,
            },
        };
    }

    async getUserDashboard(userId: string) {
        // 1. Pedidos em andamento
        const pedidosAtivos = await this.prisma.pedidoEncomenda.findMany({
            where: {
                usuarioId: userId,
                dataEncomenda: {
                    concluido: false,
                },
            },
            include: {
                dataEncomenda: true,
            },
            orderBy: {
                dataPedido: 'desc',
            },
        });

        const pedidosDiretosAtivos = await this.prisma.pedidoDireto.findMany({
            where: {
                usuarioId: userId,
                status: {
                    in: ['pendente', 'confirmado', 'preparando', 'em_entrega'],
                },
            },
            orderBy: {
                dataPedido: 'desc',
            },
        });

        // 2. Última notificação não lida
        const ultimaNotificacao = await this.prisma.notificacao.findFirst({
            where: {
                usuarioId: userId,
                lido: false,
            },
            orderBy: {
                criadoEm: 'desc',
            },
        });

        return {
            userName: (await this.prisma.usuario.findUnique({ where: { id: userId } }))?.nome,
            pedidosAtivos: [...pedidosAtivos, ...pedidosDiretosAtivos],
            ultimaNotificacao,
            quickStats: {
                totalPedidos: await this.prisma.pedidoEncomenda.count({ where: { usuarioId: userId } }) +
                    await this.prisma.pedidoDireto.count({ where: { usuarioId: userId } }),
            },
        };
    }

    private groupByMonth(data: any[], dateField: string, valueField: string) {
        const months = {};
        data.forEach((item) => {
            const date = new Date(item[dateField]);
            const monthYear = `${date.getMonth() + 1}/${date.getFullYear()}`;
            if (!months[monthYear]) {
                months[monthYear] = 0;
            }
            months[monthYear] += Number(item._sum[valueField] || 0);
        });

        return Object.keys(months).map((key) => ({
            label: key,
            value: months[key],
        })).sort((a, b) => {
            const [mA, yA] = a.label.split('/').map(Number);
            const [mB, yB] = b.label.split('/').map(Number);
            return yA !== yB ? yA - yB : mA - mB;
        });
    }
}
