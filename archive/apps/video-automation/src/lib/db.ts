import { PrismaClient } from '@prisma/client';
import path from 'path';

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined;
};

// Get absolute path to the shared database
// __dirname is resolved from this file's location: apps/video-automation/src/lib/
// Database is at: data/ymm.db (relative to project root)
const projectRoot = path.resolve(__dirname, '../../../../..');
const dbPath = path.join(projectRoot, 'data', 'ymm.db');
const dbUrl = process.env.DATABASE_URL || `file:${dbPath}`;

console.log('[DB] Using database at:', dbPath);

export const prisma =
    globalForPrisma.prisma ??
    new PrismaClient({
        datasources: {
            db: {
                url: dbUrl,
            },
        },
        log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

