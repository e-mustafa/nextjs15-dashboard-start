import attachPrismaLogger from '@/lib/logs/prisma-logger.middleware';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
// import { PrismaClient } from "./generated/client";

const adapter = new PrismaPg({
	connectionString: process.env.DATABASE_URL!,
});

export const prisma_DB = new PrismaClient({ adapter });

// export const prisma_DB =
// 	globalForPrisma.prisma ??
// 	new PrismaClient({
// 		log: isDEV ? ['query', 'info', 'warn', 'error'] : ['error'],
// 	});


// ✅ Attach custom logger safely
try {
	attachPrismaLogger(prisma_DB);
} catch (err) {
	console.warn('⚠️ Prisma logger attachment skipped:', err);
}

// if (isDEV) globalForPrisma.prisma = prisma_DB;
