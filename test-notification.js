const { Expo } = require('expo-server-sdk');

const expo = new Expo();
const tokens = [
    'ExponentPushToken[TN52_fJRuos_xk0rHsWD7-]',
    'ExponentPushToken[iURzY4NNfY85iLRGoQYNqA]',
    'ExponentPushToken[kPfJCrD5SEGXBtqc4nhQdC]'
];

async function sendTestNotification() {
    const messages = [];
    for (const token of tokens) {
        if (Expo.isExpoPushToken(token)) {
            messages.push({
                to: token,
                sound: 'default',
                title: '🍱 Yatsunami Integration Test',
                body: 'Este é um teste de integração de notificações push!',
                data: { test: true },
            });
        } else {
            console.warn(`Token ${token} is not valid`);
        }
    }

    if (messages.length === 0) return;

    let chunks = expo.chunkPushNotifications(messages);
    for (let chunk of chunks) {
        try {
            let ticketChunk = await expo.sendPushNotificationsAsync(chunk);
            console.log('Tickets:', JSON.stringify(ticketChunk, null, 2));
        } catch (error) {
            console.error('Error sending notification:', error);
        }
    }
}

sendTestNotification();
