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

        // 5. Available Years with data
        const [minVenda, minDespesa] = await Promise.all([
            this.prisma.venda.findFirst({
                select: { data: true },
                orderBy: { data: 'asc' },
            }),
            this.prisma.notaDespesa.findFirst({
                select: { dataCompra: true },
                orderBy: { dataCompra: 'asc' },
            }),
        ]);

        const startYear = Math.min(
            minVenda?.data?.getFullYear() || now.getFullYear(),
            minDespesa?.dataCompra?.getFullYear() || now.getFullYear()
        );
        const endYear = now.getFullYear();

        const availableYears: number[] = [];
        for (let y = endYear; y >= startYear; y--) {
            availableYears.push(y);
        }

        return {
            summary: {
                totalReceita,
                totalDespesas,
                lucroLiquido,
                margem,
                pedidosPendentes: pedidosPendentes + pedidosDiretosPendentes,
            },
            history: unifiedHistory,
            availableYears,
            filters: {
                year,
                month,
            },
        };
    }

    async getUserDashboard(userId: string) {
        const now = new Date();
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

        // 1. User info
        const usuario = await this.prisma.usuario.findUnique({
            where: { id: userId },
            select: { nome: true, avatarUrl: true },
        });

        // 2. Formulário aberto agora (aceita pedidos)
        const formAberta = await this.prisma.dataEncomenda.findFirst({
            where: {
                ativo: true,
                concluido: false,
                dataLimitePedido: { gte: now },
                OR: [
                    { dataInicioPedido: null },
                    { dataInicioPedido: { lte: now } },
                ],
            },
            orderBy: { dataEntrega: 'asc' },
        });

        // 3. Check if user already has an order for the open form
        let jaFezPedidoFormAberta = false;
        if (formAberta) {
            const pedidoExistente = await this.prisma.pedidoEncomenda.findFirst({
                where: {
                    usuarioId: userId,
                    dataEncomendaId: formAberta.id,
                    statusPagamento: { not: 'cancelado' },
                },
            });
            jaFezPedidoFormAberta = !!pedidoExistente;
        }

        // 4. Próximos pedidos (forms ativos + recently closed)
        const proximosPedidosRaw = await this.prisma.dataEncomenda.findMany({
            where: {
                OR: [
                    { ativo: true },
                    { dataLimitePedido: { gte: sevenDaysAgo } },
                ],
            },
            orderBy: { dataEntrega: 'asc' },
            take: 5,
        });

        const proximosPedidos = proximosPedidosRaw.map(form => ({
            id: form.id,
            data_entrega: form.dataEntrega instanceof Date ? form.dataEntrega.toISOString().split('T')[0] : form.dataEntrega,
            data_inicio_pedido: form.dataInicioPedido ?? null,
            data_limite_pedido: form.dataLimitePedido,
            observacoes: form.observacoes ?? null,
            ativo: form.ativo,
            concluido: form.concluido,
        }));

        // 5. Últimos pedidos do usuário
        const meusUltimosPedidos = await this.prisma.pedidoEncomenda.findMany({
            where: { usuarioId: userId },
            include: {
                dataEncomenda: {
                    select: { dataEntrega: true },
                },
            },
            orderBy: { dataPedido: 'desc' },
            take: 3,
        });

        // 6. Última notificação não lida
        const ultimaNotificacao = await this.prisma.notificacao.findFirst({
            where: { usuarioId: userId, lido: false },
            orderBy: { criadoEm: 'desc' },
        });

        // 7. Quick stats
        const [totalEncomendas, totalDiretos] = await Promise.all([
            this.prisma.pedidoEncomenda.count({ where: { usuarioId: userId } }),
            this.prisma.pedidoDireto.count({ where: { usuarioId: userId } }),
        ]);

        return {
            userName: usuario?.nome ?? null,
            avatarUrl: usuario?.avatarUrl ?? null,
            formAberta: formAberta ? {
                id: formAberta.id,
                data_entrega: formAberta.dataEntrega instanceof Date ? formAberta.dataEntrega.toISOString().split('T')[0] : formAberta.dataEntrega,
                data_inicio_pedido: formAberta.dataInicioPedido ?? null,
                data_limite_pedido: formAberta.dataLimitePedido,
                observacoes: formAberta.observacoes ?? null,
            } : null,
            jaFezPedidoFormAberta,
            proximosPedidos,
            meusUltimosPedidos: meusUltimosPedidos.map(p => ({
                id: p.id,
                codigo: p.codigo,
                dataPedido: p.dataPedido,
                statusPagamento: p.statusPagamento,
                totalValor: p.totalValor,
                dataEntrega: p.dataEncomenda.dataEntrega,
            })),
            ultimaNotificacao,
            quickStats: {
                totalPedidos: totalEncomendas + totalDiretos,
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
