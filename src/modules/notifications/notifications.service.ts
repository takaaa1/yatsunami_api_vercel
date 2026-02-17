import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma';
import { Expo, ExpoPushMessage } from 'expo-server-sdk';

@Injectable()
export class NotificationsService {
    private expo: Expo;
    private readonly logger = new Logger(NotificationsService.name);

    constructor(private prisma: PrismaService) {
        this.expo = new Expo({
            accessToken: process.env.EXPO_ACCESS_TOKEN,
        });
    }

    async createAndSendNotification(data: {
        usuarioId: string;
        titulo: string;
        mensagem: string;
        dataEncomendaId?: number;
        pedidoDiretoId?: number;
        tipo?: string;
    }) {
        // 1. Salvar no banco (Inbox)
        const notificacao = await this.prisma.notificacao.create({
            data: {
                usuarioId: data.usuarioId,
                titulo: data.titulo,
                mensagem: data.mensagem,
                dataEncomendaId: data.dataEncomendaId,
                pedidoDiretoId: data.pedidoDiretoId,
                tipo: data.tipo || 'user',
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
                        data: {
                            notificacaoId: notificacao.id,
                            dataEncomendaId: data.dataEncomendaId,
                            pedidoDiretoId: data.pedidoDiretoId,
                            tipo: data.tipo || 'user'
                        },
                        // @ts-ignore - Required for EAS
                        projectId: process.env.EXPO_PROJECT_ID,
                    } as any,
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

    async broadcastNotification(data: {
        usuarioIds: string[];
        titulo: string;
        mensagem: string;
        dataEncomendaId?: number;
        pedidoDiretoId?: number;
        tipo?: string;
    }) {
        const results = [];

        // Criar notificações na Inbox em massa
        const createdNotificacoes = await this.prisma.notificacao.createMany({
            data: data.usuarioIds.map(id => ({
                usuarioId: id,
                titulo: data.titulo,
                mensagem: data.mensagem,
                dataEncomendaId: data.dataEncomendaId,
                pedidoDiretoId: data.pedidoDiretoId,
                tipo: data.tipo || 'admin',
            })),
        });

        // Buscar tokens para envio push
        const usuarios = await this.prisma.usuario.findMany({
            where: {
                id: { in: data.usuarioIds },
                receberNotificacoes: true,
                expoPushToken: { not: null },
            },
            select: { id: true, expoPushToken: true },
        });

        const messages: ExpoPushMessage[] = [];
        for (const usuario of usuarios) {
            if (usuario.expoPushToken && Expo.isExpoPushToken(usuario.expoPushToken)) {
                messages.push({
                    to: usuario.expoPushToken,
                    sound: 'default',
                    title: data.titulo,
                    body: data.mensagem,
                    data: {
                        dataEncomendaId: data.dataEncomendaId,
                        pedidoDiretoId: data.pedidoDiretoId,
                        tipo: data.tipo || 'admin'
                    },
                    // @ts-ignore - Required for EAS
                    projectId: process.env.EXPO_PROJECT_ID,
                } as any);
            }
        }

        if (messages.length > 0) {
            let chunks = this.expo.chunkPushNotifications(messages);
            for (let chunk of chunks) {
                try {
                    await this.expo.sendPushNotificationsAsync(chunk);
                } catch (error) {
                    this.logger.error(`Erro ao enviar broadcast push chunk: ${error}`);
                }
            }
        }

        return createdNotificacoes;
    }
}
