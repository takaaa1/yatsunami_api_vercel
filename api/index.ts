import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import { ExpressAdapter } from '@nestjs/platform-express';
import express from 'express';

const server = express();

let cachedApp;

const bootstrap = async (expressInstance) => {
    const app = await NestFactory.create(
        AppModule,
        new ExpressAdapter(expressInstance),
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

    // Temporarily disabling Swagger to debug the 500 error
    /*
    const { SwaggerModule, DocumentBuilder } = await import('@nestjs/swagger');
    const swaggerConfig = new DocumentBuilder()
      .setTitle('Yatsunami API')
      .setVersion('1.0')
      .build();
    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/docs', app, document);
    */

    await app.init();
    return app;
};

export default async (req, res) => {
    try {
        if (!cachedApp) {
            cachedApp = await bootstrap(server);
        }
        server(req, res);
    } catch (err: any) {
        res.status(500).send(err.message);
    }
};
