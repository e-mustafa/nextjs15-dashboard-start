import { logger } from './logger';

// ✅ We only register the handlers once
if (!(global as any)._loggerGlobalRegistered) {
	process.on('uncaughtException', (err) => {
		logger.error(`❌ Uncaught Exception: ${err.message}`, {
			context: 'Global',
			stack: err.stack,
		});
	});

	process.on('unhandledRejection', (reason: any) => {
		logger.error(`⚠️ Unhandled Rejection: ${String(reason)}`, {
			context: 'Global',
			details: reason,
		});
	});

	process.on('SIGTERM', () => {
		logger.info('🛑 Server stopped by SIGTERM', { context: 'Global' });
		process.exit(0);
	});

	process.on('SIGINT', () => {
		logger.info('🛑 Server stopped by SIGINT (Ctrl+C)', { context: 'Global' });
		process.exit(0);
	});

	// ✅ intercept fetch errors once globally
	if (typeof globalThis.fetch !== 'undefined') {
		const originalFetch = globalThis.fetch;
		globalThis.fetch = async (...args) => {
			const [url] = args;
			try {
				const res = await originalFetch(...args);
				if (!res.ok) {
					logger.warn(`⚠️ Fetch failed: ${res.status} ${res.statusText}`, {
						context: 'Fetch',
						url: typeof url === 'string' ? url : url.toString(),
					});
				}
				return res;
			} catch (error) {
				logger.error(`❌ Fetch error: ${(error as Error).message}`, {
					context: 'Fetch',
					url: typeof url === 'string' ? url : url.toString(),
				});
				throw error;
			}
		};
	}

	logger.info('✅ Global logger initialized successfully', { context: 'Global' });
	(global as any)._loggerGlobalRegistered = true;
}
