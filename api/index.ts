import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from '../src/app.module';

let cachedHandler;

async function getHandler() {
    if (!cachedHandler) {
        const app = await NestFactory.create(AppModule);

        app.enableCors({
            origin: true,
            methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
            credentials: true,
        });

        app.setGlobalPrefix('api');
        app.useGlobalPipes(new ValidationPipe({
            whitelist: true,
            forbidNonWhitelisted: true,
            transform: true,
            transformOptions: {
                enableImplicitConversion: true,
            },
        }));

        await app.init();
        cachedHandler = app.getHttpAdapter().getInstance();
    }
    return cachedHandler;
}

export default async (req, res) => {
    try {
        const handler = await getHandler();
        handler(req, res);
    } catch (err: any) {
        console.error('Vercel Execution Error:', err);
        res.status(500).json({
            statusCode: 500,
            message: 'Vercel Runtime Error',
            error: err.message,
        });
    }
};
