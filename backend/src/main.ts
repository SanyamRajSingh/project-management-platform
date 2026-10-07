import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';
import { AppExceptionFilter } from './common/filters/app-exception.filter';
import { ResponseTransformInterceptor } from './common/interceptors/response-transform.interceptor';
import { API_PREFIX } from './shared/constants';
import type { NextFunction, Request, Response } from 'express';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    rawBody: true,
    bufferLogs: true,
  });

  app.getHttpAdapter().getInstance().set('etag', false);
  app.use((_req: Request, res: Response, next: NextFunction) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.setHeader('Pragma', 'no-cache');
    next();
  });

  // URL Rewrite middleware: Map assignment-specified /api/* endpoints seamlessly to /api/v1/*
  // preserving full backward compatibility without duplicate controllers.
  app.use((req: Request, _res: Response, next: NextFunction) => {
    if (
      req.url.startsWith('/api/') &&
      !req.url.startsWith('/api/v1/') &&
      !req.url.startsWith('/api/docs')
    ) {
      req.url = req.url.replace(/^\/api\//, '/api/v1/');
    }
    next();
  });

  app.useLogger(app.get(Logger));
  app.enableShutdownHooks();

  app.setGlobalPrefix(API_PREFIX);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalFilters(new AppExceptionFilter());
  app.useGlobalInterceptors(new ResponseTransformInterceptor());

  // Environment-driven CORS configuration
  const allowedOrigins = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim())
    : [
        'http://localhost:3000',
        'http://localhost:3001',
        'http://127.0.0.1:3000',
        'http://127.0.0.1:3001',
      ];

  app.enableCors({
    origin: (origin, callback) => {
      // Mobile apps, server-to-server, or curl do not have origin headers
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(null, false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'x-organization-id',
      'x-request-id',
    ],
  });

  // Swagger OpenAPI documentation
  const { DocumentBuilder, SwaggerModule } = await import('@nestjs/swagger');
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Flowtide API')
    .setDescription(
      'Unified REST API for Flowtide Project & Task Management (Web & Mobile Android)',
    )
    .setVersion('1.0.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        description: 'Enter your Bearer access token',
        in: 'header',
      },
      'bearer-auth',
    )
    .addTag('auth', 'Authentication and user identity')
    .addTag('projects', 'Project management')
    .addTag('tasks', 'Task management')
    .addTag('dashboard', 'Aggregated statistics and dashboard')
    .build();

  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, swaggerDocument, {
    customSiteTitle: 'Flowtide API Documentation',
  });

  // Required so Socket.IO attaches to the same HTTP server as REST (fixes ws:// connection failures).
  app.useWebSocketAdapter(new IoAdapter(app));

  const port = process.env.PORT || 3000;
  await app.listen(port, '0.0.0.0');
}

bootstrap();
