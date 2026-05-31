"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const helmet_1 = require("helmet");
const app_module_1 = require("./app.module");
const http_exception_filter_1 = require("./common/filters/http-exception.filter");
const transform_interceptor_1 = require("./common/interceptors/transform.interceptor");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule, {
        cors: {
            origin: (origin, callback) => {
                const allowed = [
                    process.env.FRONTEND_URL,
                    process.env.DASHBOARD_URL,
                ].filter(Boolean);
                const ok = !origin ||
                    allowed.includes(origin) ||
                    /\.vercel\.app$/.test(origin) ||
                    /^https?:\/\/localhost(:\d+)?$/.test(origin);
                callback(null, ok ? origin : false);
            },
            credentials: true,
        },
        bufferLogs: true,
    });
    const configService = app.get(config_1.ConfigService);
    app.use((0, helmet_1.default)());
    app.setGlobalPrefix('api');
    app.enableVersioning({ type: common_1.VersioningType.URI, defaultVersion: '1' });
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
    }));
    app.useGlobalFilters(new http_exception_filter_1.HttpExceptionFilter());
    app.useGlobalInterceptors(new transform_interceptor_1.TransformInterceptor());
    const port = configService.get('PORT', 3001);
    await app.listen(port);
    console.log(`Smart Pickup API running on port ${port}`);
}
bootstrap();
