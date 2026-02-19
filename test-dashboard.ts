
import { PrismaClient } from '@prisma/client';

async function main() {
    const prisma = new PrismaClient();
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    console.log('Year:', year, 'Month:', month);
    console.log('StartDate:', startDate.toISOString());
    console.log('EndDate:', endDate.toISOString());

    const summaryVendas = await prisma.venda.aggregate({
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

    const summaryDespesas = await prisma.notaDespesa.aggregate({
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

    console.log('Summary Vendas:', JSON.stringify(summaryVendas));
    console.log('Summary Despesas:', JSON.stringify(summaryDespesas));

    const totalReceita = Number(summaryVendas._sum.total) || 0;
    const totalDespesas = Number(summaryDespesas._sum.valorTotal) || 0;

    console.log('Total Receita:', totalReceita);
    console.log('Total Despesas:', totalDespesas);

    await prisma.$disconnect();
}

main();
