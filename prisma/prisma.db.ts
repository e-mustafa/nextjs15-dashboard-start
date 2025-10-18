import { isDEV } from '@/configs/general';
import { attachPrismaLogger } from '@/lib/logs/prisma-logger.middleware';
import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as {
	prisma: PrismaClient | undefined;
};

export const prisma_DB =
	globalForPrisma.prisma ??
	new PrismaClient({
		log: isDEV ? ['query', 'info', 'warn', 'error'] : ['error'],
	});

// ✅ Attach custom logger safely
try {
	attachPrismaLogger(prisma_DB);
} catch (err) {
	console.warn('⚠️ Prisma logger attachment skipped:', err);
}

if (isDEV) globalForPrisma.prisma = prisma_DB;
