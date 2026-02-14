"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcrypt = require("bcrypt");
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('🌱 Seeding database...');
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
    const categorias = [
        { nome: { 'pt-BR': 'Sushi', 'ja-JP': '寿司' }, ordem: 1 },
        { nome: { 'pt-BR': 'Temaki', 'ja-JP': '手巻き' }, ordem: 2 },
        { nome: { 'pt-BR': 'Sashimi', 'ja-JP': '刺身' }, ordem: 3 },
        { nome: { 'pt-BR': 'Bentô', 'ja-JP': '弁当' }, ordem: 4 },
        { nome: { 'pt-BR': 'Sobremesa', 'ja-JP': 'デザート' }, ordem: 5 },
    ];
    await prisma.categoria.createMany({
        data: categorias,
    });
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
//# sourceMappingURL=seed.js.map