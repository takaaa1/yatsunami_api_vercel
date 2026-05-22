import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { QrParserService } from './qr-parser.service';
import { CreateExpenseDto } from './dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class ExpensesService {
    private readonly logger = new Logger(ExpensesService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly qrParserService: QrParserService,
    ) { }

    /** Limites do dia em UTC (params yyyy-MM-dd do app). */
    private dayStartUtc(value: string): Date {
        const [y, m, d] = value.split('T')[0].split('-').map(Number);
        return new Date(Date.UTC(y, m - 1, d, 0, 0, 0, 0));
    }

    private dayEndUtc(value: string): Date {
        const [y, m, d] = value.split('T')[0].split('-').map(Number);
        return new Date(Date.UTC(y, m - 1, d, 23, 59, 59, 999));
    }

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

    async findAll(query: { limit?: number; offset?: number; search?: string; dateFrom?: string; dateTo?: string }) {
        const { limit = 20, offset = 0, search, dateFrom, dateTo } = query;

        const where: Prisma.NotaDespesaWhereInput = {};
        if (search) {
            where.OR = [
                { nomeEstabelecimento: { contains: search, mode: 'insensitive' } },
            ];
        }
        let dateFilter: { gte?: Date; lte?: Date } | undefined;
        if (dateFrom || dateTo) {
            dateFilter = {
                ...(dateFrom && { gte: this.dayStartUtc(dateFrom) }),
                ...(dateTo && { lte: this.dayEndUtc(dateTo) }),
            };
            where.dataCompra = dateFilter;
        }

        this.logger.log(
            `[findAll] query=${JSON.stringify({ limit, offset, search: search ?? null, dateFrom: dateFrom ?? null, dateTo: dateTo ?? null })} ` +
            `dateFilter=${dateFilter ? JSON.stringify({
                gte: dateFilter.gte?.toISOString() ?? null,
                lte: dateFilter.lte?.toISOString() ?? null,
            }) : 'none'}`,
        );

        const [items, total] = await Promise.all([
            this.prisma.notaDespesa.findMany({
                where,
                include: { itens: true },
                orderBy: [{ dataCompra: 'desc' }, { id: 'desc' }],
                take: limit,
                skip: offset,
            }),
            this.prisma.notaDespesa.count({ where }),
        ]);

        this.logger.log(
            `[findAll] result total=${total} returned=${items.length} ` +
            `ids=[${items.map((i) => i.id).join(',')}] ` +
            `datas=[${items.map((i) => i.dataCompra?.toISOString() ?? 'null').join(', ')}]`,
        );

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
