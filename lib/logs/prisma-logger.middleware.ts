// lib/logs/prisma-logger.middleware.ts
import { isDEV } from '@/configs/general';
import { Prisma, PrismaClient } from '@prisma/client';
import { logger } from './logger';

type PrismaOnQuery = (eventType: 'query', callback: (e: Prisma.QueryEvent) => void) => void;
type PrismaOnEvent = (eventType: 'info' | 'warn' | 'error', callback: (e: Prisma.LogEvent) => void) => void;
/**
 * ✅ Attach runtime logging to PrismaClient events
 * Logs: query, info, warn, error
 */
export function attachPrismaLogger(prisma: PrismaClient) {
	// ✅ Log SQL queries
	(prisma.$on as PrismaOnQuery)('query', (e) => {
		const msg = `SQL: ${e.query} | Params: ${e.params} | Duration: ${e.duration}ms`;
		logger.debug(msg, { context: 'Prisma' });
		if (isDEV) console.log(`\x1b[36m[Prisma Query]\x1b[0m ${msg}`);
	});

	// ✅ Info
	(prisma.$on as PrismaOnEvent)('info', (e) => logger.info(e.message, { context: 'Prisma' }));

	// ✅ Warning
	(prisma.$on as PrismaOnEvent)('warn', (e) => logger.warn(e.message, { context: 'Prisma' }));

	// ✅ Error
	(prisma.$on as PrismaOnEvent)('error', (e) => logger.error(e.message, { context: 'Prisma' }));
}
