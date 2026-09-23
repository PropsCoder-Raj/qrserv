import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import * as morgan from 'morgan';
import * as bodyParser from 'body-parser';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import * as dns from 'dns';
import { join } from 'path';

// Use Google DNS for SRV record resolution (fixes MongoDB Atlas +srv on some networks)
dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);

function toPostmanUrl(path: string, parameters: any[] = []) {
  const postmanPath = path.replace(/\{([^}]+)\}/g, ':$1');
  const query = parameters
    .filter((parameter) => parameter.in === 'query')
    .map((parameter) => ({
      key: parameter.name,
      value: `{{${parameter.name}}}`,
      disabled: !parameter.required,
    }));

  return {
    raw: `{{baseUrl}}${postmanPath}`,
    host: ['{{baseUrl}}'],
    path: postmanPath.replace(/^\//, '').split('/'),
    ...(query.length ? { query } : {}),
  };
}

function toPostmanBody(operation: any) {
  const content = operation.requestBody?.content || {};
  if (content['application/json']) {
    return {
      mode: 'raw',
      raw: '{}',
      options: {
        raw: {
          language: 'json',
        },
      },
    };
  }

  if (content['multipart/form-data']) {
    return {
      mode: 'formdata',
      formdata: [],
    };
  }

  return undefined;
}

function createPostmanCollection(document: any, baseUrl: string) {
  const folders = new Map<string, any[]>();
  const methods = ['get', 'post', 'put', 'patch', 'delete'];

  Object.entries(document.paths || {}).forEach(([path, pathItem]: any) => {
    methods.forEach((method) => {
      const operation = pathItem?.[method];
      if (!operation) return;

      const parameters = [
        ...(pathItem.parameters || []),
        ...(operation.parameters || []),
      ];
      const folderName = operation.tags?.[0] || 'API';
      const body = toPostmanBody(operation);
      const headers = body?.mode === 'raw'
        ? [{ key: 'Content-Type', value: 'application/json' }]
        : [];

      if (!folders.has(folderName)) {
        folders.set(folderName, []);
      }

      folders.get(folderName).push({
        name: operation.summary || operation.operationId || `${method.toUpperCase()} ${path}`,
        request: {
          method: method.toUpperCase(),
          header: headers,
          url: toPostmanUrl(path, parameters),
          ...(body ? { body } : {}),
        },
      });
    });
  });

  return {
    info: {
      name: document.info?.title || 'API Collection',
      description: document.info?.description || '',
      schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
    },
    auth: {
      type: 'bearer',
      bearer: [{ key: 'token', value: '{{token}}', type: 'string' }],
    },
    variable: [
      { key: 'baseUrl', value: baseUrl },
      { key: 'token', value: '' },
    ],
    item: Array.from(folders.entries()).map(([name, item]) => ({ name, item })),
  };
}

async function bootstrap() {
  // Disable Nest's default body-parser so we can capture rawBody for Razorpay webhook signature verification.
  const app = await NestFactory.create(AppModule, { bodyParser: false });
  const configService = app.get(ConfigService);

  // Capture rawBody (needed for verifying Razorpay webhook signatures)
  app.use(
    bodyParser.json({
      verify: (req: any, _res, buf) => {
        if (buf?.length) req.rawBody = buf.toString('utf8');
      },
    }),
  );
  app.use(
    bodyParser.urlencoded({
      extended: true,
      verify: (req: any, _res, buf) => {
        if (buf?.length) req.rawBody = buf.toString('utf8');
      },
    }),
  );

  // Global pipes, filters, interceptors
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new TransformInterceptor());

  // HTTP request logging
  app.use(morgan('dev'));

  // CORS
  app.enableCors();

  // Static uploads (menu PDFs, etc.)
  // Files are stored under: <projectRoot>/backend/uploads
  // NOTE: use express static because useStaticAssets isn't available on INestApplication typings here.
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const express = require('express');
  app.use('/uploads', express.static(join(process.cwd(), 'uploads')));
  app.use('/api/uploads', express.static(join(process.cwd(), 'uploads')));

  const port = configService.get<number>('port') || 3000;
  const baseUrl = `http://localhost:${port}`;

  // Swagger
  const config = new DocumentBuilder()
    .setTitle('QR Code Restaurant Ordering System')
    .setDescription(
      'API for multi-restaurant QR code ordering system. Customers scan table QR codes to view menus and place orders.\n\n[Download Postman Collection](/api/docs/postman)',
    )
    .setVersion('1.0')
    .addServer(baseUrl)
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  app.getHttpAdapter().get('/api/docs/postman', (_req, res) => {
    const collection = createPostmanCollection(document, baseUrl);

    res.setHeader('Content-Type', 'application/json');
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="qr-code-order.postman_collection.json"',
    );
    res.send(JSON.stringify(collection, null, 2));
  });

  await app.listen(port);
  console.log(`Application running on: http://localhost:${port}`);
  console.log(`Swagger docs: http://localhost:${port}/api/docs`);
  console.log(`Postman collection: http://localhost:${port}/api/docs/postman`);
}
bootstrap();
