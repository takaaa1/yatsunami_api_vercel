import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const users = await prisma.usuario.findMany({
        where: {
            expoPushToken: {
                not: null,
            },
        },
    });

    for (const user of users) {
        console.log('ID:', user.id);
        console.log('NAME:', user.nome);
        console.log('TOKEN:', user.expoPushToken);
        console.log('---');
    }
}

main().finally(() => prisma.$disconnect());
