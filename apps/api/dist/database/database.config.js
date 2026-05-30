"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.databaseConfig = void 0;
const path_1 = require("path");
const databaseConfig = (config) => {
    const isProduction = config.get('NODE_ENV') === 'production';
    const dbUrl = config.get('DATABASE_URL') ?? '';
    const isNeon = dbUrl.includes('neon.tech');
    return {
        type: 'postgres',
        url: dbUrl,
        entities: [(0, path_1.join)(__dirname, '..', '**', '*.entity{.ts,.js}')],
        migrations: [(0, path_1.join)(__dirname, 'migrations', '*{.ts,.js}')],
        synchronize: true,
        logging: !isProduction,
        ssl: (isProduction || isNeon) ? { rejectUnauthorized: false } : false,
        extra: (isProduction || isNeon) ? {
            ssl: { rejectUnauthorized: false },
        } : undefined,
    };
};
exports.databaseConfig = databaseConfig;
