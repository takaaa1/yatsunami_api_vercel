import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class DashboardService {
    constructor(private prisma: PrismaService) { }

    async getAdminDashboard(filters?: { year?: number; month?: number }) {
        const now = new Date();
        const year = filters?.year || now.getFullYear();
        const month = filters?.month !== undefined ? filters.month : now.getMonth() + 1;

        // Calculate start and end dates for the summary
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0, 23, 59, 59, 999);

        // 1. Total Vendas (filtered)
        const summaryVendas = await this.prisma.venda.aggregate({
            _sum: {
                total: true,
            },
            where: {
                data: {
                    gte: startDate,
                    lte: endDate,
                },
            },
        });

        // 2. Total Despesas (filtered)
        const summaryDespesas = await this.prisma.notaDespesa.aggregate({
            _sum: {
                valorTotal: true,
            },
            where: {
                dataCompra: {
                    gte: startDate,
                    lte: endDate,
                },
            },
        });

        // 3. Vendas por mês (últimos 6 meses a partir do período selecionado)
        const chartStart = new Date(startDate);
        chartStart.setMonth(chartStart.getMonth() - 5);

        const vendasPorMes = await this.prisma.venda.groupBy({
            by: ['data'],
            where: {
                data: {
                    gte: chartStart,
                    lte: endDate,
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
                    gte: chartStart,
                    lte: endDate,
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

        const totalReceita = Number(summaryVendas._sum.total) || 0;
        const totalDespesas = Number(summaryDespesas._sum.valorTotal) || 0;
        const lucroLiquido = totalReceita - totalDespesas;
        const margem = totalReceita > 0 ? (lucroLiquido / totalReceita) * 100 : 0;

        return {
            summary: {
                totalReceita,
                totalDespesas,
                lucroLiquido,
                margem,
                pedidosPendentes: pedidosPendentes + pedidosDiretosPendentes,
            },
            charts: {
                vendas: formattedVendas,
                despesas: formattedDespesas,
            },
            filters: {
                year,
                month,
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
