import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { load } from 'cheerio';
import type { CheerioAPI } from 'cheerio';
import { XMLParser } from 'fast-xml-parser';

@Injectable()
export class QrParserService {
    private readonly logger = new Logger(QrParserService.name);
    private readonly xmlParser = new XMLParser({
        ignoreAttributes: false,
        attributeNamePrefix: '@_',
    });

    async parseQrCode(url: string) {
        try {
            const headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            };

            const response = await axios.get(url, { headers, timeout: 10000 });
            const html = response.data;
            const $ = load(html);

            // Try to find XML link first
            let xmlContent: string | null = null;
            const xmlLink = $('a').filter((_, el) => {
                const href = $(el).attr('href') || '';
                const text = $(el).text().toLowerCase();
                return text.includes('xml') || href.toLowerCase().endsWith('.xml');
            }).attr('href');

            if (xmlLink) {
                const xmlUrl = new URL(xmlLink, url).href;
                const xmlResponse = await axios.get(xmlUrl, { headers, timeout: 10000 });
                xmlContent = xmlResponse.data;
            } else {
                const preText = $('pre').text().trim();
                if (preText.startsWith('<?xml')) {
                    xmlContent = preText;
                }
            }

            if (xmlContent) {
                return this.parseXml(xmlContent, url);
            }

            return this.parseHtml($, url);
        } catch (error) {
            this.logger.error(`Error parsing QR Code: ${error.message}`);
            throw error;
        }
    }

    private parseXml(xml: string, url: string) {
        const jsonObj = this.xmlParser.parse(xml);
        // Simplified parsing based on legacy logic
        const nfe = jsonObj['nfeProc']?.['NFe'] || jsonObj['NFe'];
        const infNfe = nfe?.['infNFe'];
        const emit = infNfe?.['emit'];
        const total = infNfe?.['total']?.['ICMSTot'];
        const det = Array.isArray(infNfe?.['det']) ? infNfe['det'] : [infNfe?.['det']].filter(Boolean);

        const itens = det.map((d: any) => ({
            descricao: d['prod']?.['xProd'] || '',
            quantidade: parseFloat(d['prod']?.['qCom'] || '0'),
            valor_unitario: parseFloat(d['prod']?.['vUnCom'] || '0'),
            valor: parseFloat(d['prod']?.['vProd'] || '0'),
        }));

        return {
            success: true,
            nome_estabelecimento: emit?.['xNome'] || 'Desconhecido',
            data_compra: infNfe?.['ide']?.['dhEmi']?.substring(0, 10) || new Date().toISOString().substring(0, 10),
            valor_total: parseFloat(total?.['vNF'] || '0'),
            qr_url: url,
            itens,
            xml_raw: xml,
        };
    }

    private parseHtml($: CheerioAPI, url: string) {
        const nome_estabelecimento = $('.txtTopo').first().text().trim() || 'Desconhecido';

        let data_compra = new Date().toISOString().substring(0, 10);
        const emissaoStrong = $('strong').filter((_, el) => !!$(el).text().match(/Emissão/i));
        if (emissaoStrong.length > 0) {
            const text = emissaoStrong.parent().text();
            const match = text.match(/(\d{2}\/\d{2}\/\d{4})/);
            if (match) {
                const [d, m, y] = match[1].split('/');
                data_compra = `${y}-${m}-${d}`;
            }
        }

        const extrairValor = (label: string) => {
            let valor = 0;
            $('#linhaTotal').each((_, el) => {
                const lbl = $(el).find('label').text().toLowerCase();
                if (lbl.includes(label.toLowerCase())) {
                    const valText = $(el).find('.totalNumb').text().trim();
                    valor = parseFloat(valText.replace(/\./g, '').replace(',', '.'));
                }
            });
            return valor;
        };

        const valor_total = extrairValor('Valor a pagar') || extrairValor('Valor total');
        const valor_desconto = extrairValor('Descontos');
        const valor_total_sem_desconto = extrairValor('Valor total');

        const itens: any[] = [];
        $('table#tabResult tr').each((_, el) => {
            const descricao = $(el).find('span.txtTit2').text().trim();
            if (descricao) {
                const qtdText = $(el).find('span.Rqtd').text().replace(/Qtde\.:/i, '').trim();
                const quantidade = parseFloat(qtdText.replace(',', '.')) || 1;

                const vunitText = $(el).find('span.RvlUnit').text().replace(/Vl\. Unit\.:/i, '').trim();
                const valor_unitario = parseFloat(vunitText.replace(',', '.')) || 0;

                const vtotalText = $(el).find('span.valor').text().trim();
                const valor = parseFloat(vtotalText.replace(',', '.')) || (quantidade * valor_unitario);

                itens.push({ descricao, quantidade, valor_unitario, valor });
            }
        });

        return {
            success: true,
            nome_estabelecimento,
            data_compra,
            valor_total,
            valor_total_sem_desconto,
            valor_desconto,
            qr_url: url,
            itens,
        };
    }
}
