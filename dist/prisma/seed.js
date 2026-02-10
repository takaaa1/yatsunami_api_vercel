"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcrypt = __importStar(require("bcrypt"));
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