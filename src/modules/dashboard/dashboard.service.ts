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

        // 3. Unified History (Last 12 months for chart flexibility)
        const chartStart = new Date(startDate);
        chartStart.setFullYear(chartStart.getFullYear() - 1);
        chartStart.setDate(1);

        const vendasHistory = await this.prisma.venda.groupBy({
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

        const despesasHistory = await this.prisma.notaDespesa.groupBy({
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

        const unifiedHistory = this.groupByMonthUnified(vendasHistory, despesasHistory, chartStart, endDate);

        // 4. Contagem de Pedidos Pendentes
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
            history: unifiedHistory,
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

    private groupByMonthUnified(vendas: any[], despesas: any[], chartStart: Date, chartEnd: Date) {
        const result = {};

        // Initialize all months in the range
        let current = new Date(chartStart);
        while (current <= chartEnd) {
            const key = `${current.getMonth() + 1}/${current.getFullYear()}`;
            result[key] = { revenue: 0, expenses: 0 };
            current.setMonth(current.getMonth() + 1);
        }

        vendas.forEach(item => {
            const date = new Date(item.data);
            const key = `${date.getMonth() + 1}/${date.getFullYear()}`;
            if (result[key]) {
                result[key].revenue += Number(item._sum.total || 0);
            }
        });

        despesas.forEach(item => {
            const date = new Date(item.dataCompra);
            const key = `${date.getMonth() + 1}/${date.getFullYear()}`;
            if (result[key]) {
                result[key].expenses += Number(item._sum.valorTotal || 0);
            }
        });

        return Object.keys(result).map(key => ({
            label: key,
            revenue: result[key].revenue,
            expenses: result[key].expenses,
        })).sort((a, b) => {
            const [mA, yA] = a.label.split('/').map(Number);
            const [mB, yB] = b.label.split('/').map(Number);
            return yA !== yB ? yA - yB : mA - mB;
        });
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
