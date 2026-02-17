
import { PrismaClient } from '@prisma/client';
import { Expo } from 'expo-server-sdk';

const prisma = new PrismaClient();

async function debugVercelReady() {
    console.log('--- Environment Check ---');
    console.log(`EXPO_PROJECT_ID: ${process.env.EXPO_PROJECT_ID ? 'SET' : 'MISSING'}`);
    console.log(`EXPO_ACCESS_TOKEN: ${process.env.EXPO_ACCESS_TOKEN ? 'SET' : 'MISSING'}`);

    const admins = await prisma.usuario.findMany({
        where: { role: 'admin' },
        select: { id: true, nome: true, expoPushToken: true }
    });

    console.log('\n--- Admin Tokens ---');
    admins.forEach(u => {
        console.log(`User: ${u.nome}`);
        console.log(`Token: ${u.expoPushToken}`);
        if (u.expoPushToken) {
            console.log(`Is Valid Expo Token: ${Expo.isExpoPushToken(u.expoPushToken)}`);
        }
    });

    // Test send logic again with explicit log of what would be sent
    if (process.env.EXPO_ACCESS_TOKEN && process.env.EXPO_PROJECT_ID) {
        console.log('\n--- Push Attempt (Simulation) ---');
        const expo = new Expo({ accessToken: process.env.EXPO_ACCESS_TOKEN });
        const tokens = admins.map(a => a.expoPushToken).filter(t => t && Expo.isExpoPushToken(t)) as string[];

        if (tokens.length > 0) {
            // Test variant 1: With projectId
            console.log(`\nTest 1: With projectId (${process.env.EXPO_PROJECT_ID})`);
            const messages1 = tokens.map(token => ({
                to: token,
                sound: 'default' as const,
                title: 'Debug Push 1',
                body: 'Com projectId',
                //@ts-ignore
                projectId: process.env.EXPO_PROJECT_ID,
            }));

            try {
                const chunks = expo.chunkPushNotifications(messages1);
                for (const chunk of chunks) {
                    const tickets = await expo.sendPushNotificationsAsync(chunk);
                    console.log('Result 1:', JSON.stringify(tickets));
                }
            } catch (err: any) {
                console.error('Error 1:', err);
            }

            // Test variant 2: Without projectId (standard)
            console.log(`\nTest 2: Without projectId`);
            const messages2 = tokens.map(token => ({
                to: token,
                sound: 'default' as const,
                title: 'Debug Push 2',
                body: 'Sem projectId',
            }));

            try {
                const chunks = expo.chunkPushNotifications(messages2);
                for (const chunk of chunks) {
                    const tickets = await expo.sendPushNotificationsAsync(chunk);
                    console.log('Result 2:', JSON.stringify(tickets));
                }
            } catch (err: any) {
                console.error('Error 2:', err);
            }
        } else {
            console.log('No valid tokens to test with.');
        }
    }
    else {
        console.log('\nCannot attempt push: MISSING CREDENTIALS in local .env');
    }
}

debugVercelReady()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
