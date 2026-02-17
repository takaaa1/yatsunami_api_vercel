import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const users = await prisma.usuario.findMany({
        where: {
            expoPushToken: {
                not: null,
            },
        },
        select: {
            id: true,
            nome: true,
            expoPushToken: true,
        },
    });

    console.log('Users with Expo Push Token:');
    console.log(JSON.stringify(users, null, 2));
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
