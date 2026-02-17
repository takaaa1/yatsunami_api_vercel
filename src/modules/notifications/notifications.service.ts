import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma';
import { Expo, ExpoPushMessage } from 'expo-server-sdk';

@Injectable()
export class NotificationsService {
    private expo = new Expo();
    private readonly logger = new Logger(NotificationsService.name);

    constructor(private prisma: PrismaService) { }

    async createAndSendNotification(data: {
        usuarioId: string;
        titulo: string;
        mensagem: string;
        dataEncomendaId?: number;
    }) {
        // 1. Salvar no banco (Inbox)
        const notificacao = await this.prisma.notificacao.create({
            data: {
                usuarioId: data.usuarioId,
                titulo: data.titulo,
                mensagem: data.mensagem,
                dataEncomendaId: data.dataEncomendaId,
            },
        });

        // 2. Buscar o token de push do usuário
        const usuario = await this.prisma.usuario.findUnique({
            where: { id: data.usuarioId },
            select: { expoPushToken: true, receberNotificacoes: true },
        });

        if (usuario?.receberNotificacoes && usuario?.expoPushToken && Expo.isExpoPushToken(usuario.expoPushToken)) {
            try {
                const messages: ExpoPushMessage[] = [
                    {
                        to: usuario.expoPushToken,
                        sound: 'default',
                        title: data.titulo,
                        body: data.mensagem,
                        data: { notificacaoId: notificacao.id, dataEncomendaId: data.dataEncomendaId },
                    },
                ];

                let chunks = this.expo.chunkPushNotifications(messages);
                for (let chunk of chunks) {
                    try {
                        await this.expo.sendPushNotificationsAsync(chunk);
                    } catch (error) {
                        this.logger.error(`Erro ao enviar push chunk: ${error}`);
                    }
                }
            } catch (error) {
                this.logger.error(`Erro ao processar push: ${error}`);
            }
        }

        return notificacao;
    }

    async getUserNotifications(usuarioId: string) {
        return this.prisma.notificacao.findMany({
            where: { usuarioId },
            orderBy: { criadoEm: 'desc' },
            take: 50, // Limite para a Inbox inicial
        });
    }

    async markAsRead(id: string, usuarioId: string) {
        return this.prisma.notificacao.updateMany({
            where: { id, usuarioId },
            data: { lido: true },
        });
    }

    async markAllAsRead(usuarioId: string) {
        return this.prisma.notificacao.updateMany({
            where: { usuarioId, lido: false },
            data: { lido: true },
        });
    }
}
