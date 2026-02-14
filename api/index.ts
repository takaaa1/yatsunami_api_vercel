import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from '../src/app.module';

let cachedHandler: any;

async function getHandler() {
    if (!cachedHandler) {
        let dbUrl = process.env.DATABASE_URL || '';

        // Auto-fix for Supabase Transaction Mode (PgBouncer)
        if (dbUrl.includes('supabase.com') && dbUrl.includes('6543') && !dbUrl.includes('pgbouncer=true')) {
            const separator = dbUrl.includes('?') ? '&' : '?';
            dbUrl = `${dbUrl}${separator}pgbouncer=true&connection_limit=1`;
            process.env.DATABASE_URL = dbUrl;
        }

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

        // Fix for Swagger UI on Vercel by using CDN for assets
        SwaggerModule.setup('api/docs', app, document, {
            customCssUrl: [
                'https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui.css',
            ],
            customJs: [
                'https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui-bundle.js',
                'https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui-standalone-preset.js',
            ],
        });

        await app.init();
        cachedHandler = app.getHttpAdapter().getInstance();
    }
    return cachedHandler;
}

export default async (req: any, res: any) => {
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
