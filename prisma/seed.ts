import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding database...');

    // Create admin user
    const adminPassword = await bcrypt.hash('Admin@123', 12);
    const admin = await prisma.usuario.upsert({
        where: { email: 'admin@yatsunami.com' },
        update: {},
        create: {
            nome: 'Administrador',
            email: 'admin@yatsunami.com',
            senhaHash: adminPassword,
            role: 'admin',
            tema: 'system',
            idioma: 'pt-BR',
        },
    });
    console.log(`✅ Admin user created: ${admin.email} (id: ${admin.id})`);

    // Create sample categories
    const categorias = [
        { nome: 'Sushi', nomeJp: '寿司', ordem: 1 },
        { nome: 'Temaki', nomeJp: '手巻き', ordem: 2 },
        { nome: 'Sashimi', nomeJp: '刺身', ordem: 3 },
        { nome: 'Bentô', nomeJp: '弁当', ordem: 4 },
        { nome: 'Sobremesa', nomeJp: 'デザート', ordem: 5 },
    ];

    for (const cat of categorias) {
        await prisma.categoria.upsert({
            where: { nome: cat.nome },
            update: {},
            create: cat,
        });
    }
    console.log(`✅ ${categorias.length} categories created`);

    console.log('🎉 Seed completed!');
}

main()
    .catch((e) => {
        console.error('❌ Seed error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
