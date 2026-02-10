import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
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
