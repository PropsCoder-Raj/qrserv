"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const swagger_1 = require("@nestjs/swagger");
const morgan = require("morgan");
const bodyParser = require("body-parser");
const app_module_1 = require("./app.module");
const http_exception_filter_1 = require("./common/filters/http-exception.filter");
const transform_interceptor_1 = require("./common/interceptors/transform.interceptor");
const dns = require("dns");
const path_1 = require("path");
dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
function toPostmanUrl(path, parameters = []) {
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
function toPostmanBody(operation) {
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
function createPostmanCollection(document, baseUrl) {
    const folders = new Map();
    const methods = ['get', 'post', 'put', 'patch', 'delete'];
    Object.entries(document.paths || {}).forEach(([path, pathItem]) => {
        methods.forEach((method) => {
            const operation = pathItem?.[method];
            if (!operation)
                return;
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
    const app = await core_1.NestFactory.create(app_module_1.AppModule, { bodyParser: false });
    const configService = app.get(config_1.ConfigService);
    app.use(bodyParser.json({
        verify: (req, _res, buf) => {
            if (buf?.length)
                req.rawBody = buf.toString('utf8');
        },
    }));
    app.use(bodyParser.urlencoded({
        extended: true,
        verify: (req, _res, buf) => {
            if (buf?.length)
                req.rawBody = buf.toString('utf8');
        },
    }));
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
    }));
    app.useGlobalFilters(new http_exception_filter_1.HttpExceptionFilter());
    app.useGlobalInterceptors(new transform_interceptor_1.TransformInterceptor());
    app.use(morgan('dev'));
    app.enableCors();
    const express = require('express');
    app.use('/uploads', express.static((0, path_1.join)(process.cwd(), 'uploads')));
    app.use('/api/uploads', express.static((0, path_1.join)(process.cwd(), 'uploads')));
    const port = configService.get('port') || 3000;
    const baseUrl = `http://localhost:${port}`;
    const config = new swagger_1.DocumentBuilder()
        .setTitle('QR Code Restaurant Ordering System')
        .setDescription('API for multi-restaurant QR code ordering system. Customers scan table QR codes to view menus and place orders.\n\n[Download Postman Collection](/api/docs/postman)')
        .setVersion('1.0')
        .addServer(baseUrl)
        .addBearerAuth()
        .build();
    const document = swagger_1.SwaggerModule.createDocument(app, config);
    swagger_1.SwaggerModule.setup('api/docs', app, document);
    app.getHttpAdapter().get('/api/docs/postman', (_req, res) => {
        const collection = createPostmanCollection(document, baseUrl);
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', 'attachment; filename="qr-code-order.postman_collection.json"');
        res.send(JSON.stringify(collection, null, 2));
    });
    await app.listen(port);
    console.log(`Application running on: http://localhost:${port}`);
    console.log(`Swagger docs: http://localhost:${port}/api/docs`);
    console.log(`Postman collection: http://localhost:${port}/api/docs/postman`);
}
bootstrap();
//# sourceMappingURL=main.js.map