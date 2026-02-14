import { PrismaClient } from '@prisma/client';

async function main() {
    const prisma = new PrismaClient();
    try {
        const products = await prisma.produtoPedidoDireto.findMany();
        const varieties = await prisma.variedadePedidoDireto.findMany();
        const clients = await prisma.clientePedidoDireto.findMany();

        console.log('--- EXPRESS CONFIG STATUS ---');
        console.log('Products enabled records:', products.length);
        console.log('Varieties enabled records:', varieties.length);
        console.log('Clients enabled records:', clients.length);

        const enabledProductsCount = products.filter(p => p.habilitado).length;
        console.log('Actually enabled products:', enabledProductsCount);

        const enabledVarietiesCount = varieties.filter(v => v.habilitado).length;
        console.log('Actually enabled varieties:', enabledVarietiesCount);
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
