import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from '../src/app.module';
import { ExpressAdapter } from '@nestjs/platform-express';
import express from 'express';

const server = express();

let cachedApp;

async function createServer() {
    if (!cachedApp) {
        console.log('Initializing NestJS application for Vercel...');
        const app = await NestFactory.create(
            AppModule,
            new ExpressAdapter(server),
        );

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

        const swaggerConfig = new DocumentBuilder()
            .setTitle('Yatsunami API')
            .setDescription('API do sistema Yatsunami — gerenciamento de restaurante japonês')
            .setVersion('1.0')
            .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'JWT')
            .addServer(process.env.API_URL || 'https://yatsunami-api-vercel.vercel.app')
            .build();

        const document = SwaggerModule.createDocument(app, swaggerConfig);
        SwaggerModule.setup('api/docs', app, document);

        await app.init();
        cachedApp = app;
        console.log('NestJS application initialized successfully.');
    }
    return cachedApp;
}

export default async (req, res) => {
    try {
        await createServer();
        server(req, res);
    } catch (error: any) {
        console.error('Error during NestJS serverless execution:', error);
        res.status(500).json({
            statusCode: 500,
            message: 'Internal Server Error',
            error: error.message,
        });
    }
};
