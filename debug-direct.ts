
import { PrismaClient } from '@prisma/client';
import axios from 'axios';

const prisma = new PrismaClient();

async function debugDirectFetch() {
    console.log('--- Direct Fetch Test ---');
    const token = process.env.EXPO_ACCESS_TOKEN;
    const projectId = process.env.EXPO_PROJECT_ID;

    if (!token || !projectId) {
        console.log('Missing env vars');
        return;
    }

    const admin = await prisma.usuario.findFirst({
        where: { role: 'admin', expoPushToken: { not: null } },
    });

    if (!admin || !admin.expoPushToken) {
        console.log('No admin with token found');
        return;
    }

    console.log(`Sending to: ${admin.expoPushToken}`);
    console.log(`Project ID: ${projectId}`);

    const body = {
        to: admin.expoPushToken,
        title: 'Teste Direto',
        body: 'Se isso chegar, o problema era o SDK',
        sound: 'default',
        // For EAS, some docs suggest including projectId in the payload too
        // @ts-ignore
        _projectId: projectId,
    };

    try {
        const response = await axios.post('https://exp.host/--/api/v2/push/send', body, {
            headers: {
                'Accept': 'application/json',
                'Accept-encoding': 'gzip, deflate',
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            }
        });

        console.log('Response:', JSON.stringify(response.data, null, 2));
    } catch (error: any) {
        if (error.response) {
            console.error('Error Response:', JSON.stringify(error.response.data, null, 2));
        } else {
            console.error('Error:', error.message);
        }
    }
}

debugDirectFetch()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
