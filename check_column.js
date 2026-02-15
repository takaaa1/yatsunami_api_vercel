
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        // Check if the column exists by trying to select it or inspecting table info
        // Since we can't easily query information_schema with prisma raw easily without knowing the exact raw query for postgres? 
        // actually we can.

        const result = await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'configuracao_formularios' 
      AND column_name = 'endereco_restaurante';
    `;

        console.log('Column check result:', result);

        if (result.length > 0) {
            console.log('Column endereco_restaurante EXISTS.');
        } else {
            console.log('Column endereco_restaurante DOES NOT EXIST.');
        }
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
