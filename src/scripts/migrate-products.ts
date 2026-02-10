import { PrismaClient, Prisma } from '@prisma/client';
import * as xlsx from 'xlsx';
import * as path from 'path';
import * as fs from 'fs';

const prisma = new PrismaClient();

function parsePreco(value: unknown): number {
    if (value == null) return NaN;
    const str = String(value).trim().replace(',', '.');
    return parseFloat(str);
}

async function main() {
    // Suporta: produtos.xlsx no diretório atual (cwd) ou em yatsunami_api
    const candidates = [
        path.join(process.cwd(), 'produtos.xlsx'),
        path.join(__dirname, '..', '..', 'produtos.xlsx'),
        path.join(__dirname, '..', '..', '..', 'produtos.xlsx'),
    ];
    const filePath = candidates.find((p) => fs.existsSync(p));
    if (!filePath) {
        throw new Error(
            `Arquivo produtos.xlsx não encontrado. Coloque em: ${candidates[0]} ou em ${path.join(process.cwd(), 'produtos.xlsx')}`
        );
    }
    console.log('Reading file:', filePath);

    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data: any[] = xlsx.utils.sheet_to_json(worksheet);

    console.log(`Found ${data.length} products to migrate.`);

    const nomeAsObj = (nome: unknown): Record<string, string> =>
        typeof nome === 'object' && nome !== null ? (nome as Record<string, string>) : {};

    let categoriasCache = await prisma.categoria.findMany();

    for (const row of data) {
        const produtoNome = row['PRODUTO'];
        const produtoNomeJp = row['PRODUTO JP'];
        const preco = parsePreco(row['PREÇO']);
        const categoriaNome = row['CATEGORIA'];
        const categoriaNomeJp = row['CATEGORIA JP'];
        const ingredientes = row['INGREDIENTES'];
        const ingredientesJp = row['INGREDIENTES JP'];
        const observacoes = row['OBSERVAÇÕES'];
        const observacoesJp = row['OBSERVAÇÕES JP'];

        if (!produtoNome || isNaN(preco) || !categoriaNome) {
            console.warn(`Skipping invalid row: ${JSON.stringify(row)}`);
            continue;
        }

        // 1. Ensure category exists (busca em memória para evitar filtro JSON no Prisma)
        let categoria = categoriasCache.find(
            (c) => nomeAsObj(c.nome)['pt-BR'] === categoriaNome
        );

        if (!categoria) {
            const maxOrdem = await prisma.categoria.aggregate({ _max: { ordem: true } });
            const nextOrdem = (maxOrdem._max.ordem ?? 0) + 1;
            console.log(`Creating new category: ${categoriaNome}`);
            categoria = await prisma.categoria.create({
                data: {
                    nome: {
                        'pt-BR': categoriaNome,
                        'ja-JP': categoriaNomeJp || categoriaNome
                    },
                    ordem: nextOrdem
                }
            });
            categoriasCache.push(categoria);
        }

        // 2. Create product
        await prisma.produto.create({
            data: {
                nome: {
                    'pt-BR': produtoNome,
                    'ja-JP': produtoNomeJp || produtoNome
                },
                preco: preco,
                categoria: {
                    'pt-BR': categoriaNome,
                    'ja-JP': categoriaNomeJp || categoriaNome
                },
                ingredientes: (ingredientes || ingredientesJp)
                    ? { 'pt-BR': ingredientes || '', 'ja-JP': ingredientesJp || ingredientes || '' }
                    : Prisma.JsonNull,
                observacoes: (observacoes || observacoesJp)
                    ? { 'pt-BR': observacoes || '', 'ja-JP': observacoesJp || observacoes || '' }
                    : Prisma.JsonNull,
                ativo: true,
                // imagem is skipped as per user request
            }
        });

        console.log(`✅ Migrated: ${produtoNome}`);
    }

    console.log('🎉 Migration completed successfully!');
}

main()
    .catch((e) => {
        console.error('❌ Migration failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
