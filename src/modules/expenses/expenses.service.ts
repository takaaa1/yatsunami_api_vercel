import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { QrParserService } from './qr-parser.service';
import { CreateExpenseDto } from './dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class ExpensesService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly qrParserService: QrParserService,
    ) { }

    async parseQrCode(url: string) {
        return this.qrParserService.parseQrCode(url);
    }

    async create(createExpenseDto: CreateExpenseDto) {
        const { itens, ...notaData } = createExpenseDto;

        return this.prisma.$transaction(async (tx) => {
            const nota = await tx.notaDespesa.create({
                data: {
                    nomeEstabelecimento: notaData.nomeEstabelecimento,
                    dataCompra: notaData.dataCompra ? new Date(notaData.dataCompra) : null,
                    valorTotal: notaData.valorTotal,
                    valorTotalSemDesconto: notaData.valorTotalSemDesconto,
                    valorDesconto: notaData.valorDesconto || 0,
                    foiEditada: notaData.foiEditada || false,
                    urlQrcode: notaData.urlQrcode,
                    xmlRaw: notaData.xmlRaw,
                },
            });

            if (itens && itens.length > 0) {
                await tx.itemDespesa.createMany({
                    data: itens.map(item => ({
                        notaId: nota.id,
                        descricao: item.descricao,
                        quantidade: item.quantidade,
                        valorUnitario: item.valorUnitario,
                        valor: item.valor,
                    })),
                });
            }

            return tx.notaDespesa.findUnique({
                where: { id: nota.id },
                include: { itens: true },
            });
        });
    }

    async findAll(query: { limit?: number; offset?: number; search?: string }) {
        const { limit = 20, offset = 0, search } = query;

        const where: Prisma.NotaDespesaWhereInput = {};
        if (search) {
            where.OR = [
                { nomeEstabelecimento: { contains: search, mode: 'insensitive' } },
            ];
        }

        const [items, total] = await Promise.all([
            this.prisma.notaDespesa.findMany({
                where,
                include: { itens: true },
                orderBy: { dataCompra: 'desc' },
                take: limit,
                skip: offset,
            }),
            this.prisma.notaDespesa.count({ where }),
        ]);

        return { items, total };
    }

    async findOne(id: number) {
        const nota = await this.prisma.notaDespesa.findUnique({
            where: { id },
            include: { itens: true },
        });

        if (!nota) {
            throw new NotFoundException(`Despesa com ID ${id} não encontrada`);
        }

        return nota;
    }

    async update(id: number, updateExpenseDto: CreateExpenseDto) {
        const { itens, ...notaData } = updateExpenseDto;

        return this.prisma.$transaction(async (tx) => {
            await tx.notaDespesa.update({
                where: { id },
                data: {
                    nomeEstabelecimento: notaData.nomeEstabelecimento,
                    dataCompra: notaData.dataCompra ? new Date(notaData.dataCompra) : null,
                    valorTotal: notaData.valorTotal,
                    valorTotalSemDesconto: notaData.valorTotalSemDesconto,
                    valorDesconto: notaData.valorDesconto || 0,
                    foiEditada: notaData.foiEditada !== undefined ? notaData.foiEditada : true,
                    urlQrcode: notaData.urlQrcode,
                    xmlRaw: notaData.xmlRaw,
                },
            });

            if (itens) {
                // Easiest way is to delete and recreate items for a simple expense note
                await tx.itemDespesa.deleteMany({ where: { notaId: id } });
                await tx.itemDespesa.createMany({
                    data: itens.map(item => ({
                        notaId: id,
                        descricao: item.descricao,
                        quantidade: item.quantidade,
                        valorUnitario: item.valorUnitario,
                        valor: item.valor,
                    })),
                });
            }

            return tx.notaDespesa.findUnique({
                where: { id },
                include: { itens: true },
            });
        });
    }

    async delete(id: number) {
        const nota = await this.prisma.notaDespesa.findUnique({ where: { id } });
        if (!nota) {
            throw new NotFoundException(`Despesa com ID ${id} não encontrada`);
        }

        return this.prisma.notaDespesa.delete({ where: { id } });
    }
}
