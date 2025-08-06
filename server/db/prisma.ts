import { isDEV, isPROD } from '@/configs/general';
import { PrismaClient } from '../../lib/generated/prisma';
// import {PrismaClient} from '@prisma/client';

const globalForPrisma = global as unknown as {
	prisma: PrismaClient;
};

export const prisma_DB =
	globalForPrisma.prisma ??
	new PrismaClient({
		log: isDEV ? ['query', 'info', 'warn', 'error'] : ['error'],
	});

if (isPROD) globalForPrisma.prisma = prisma_DB;
