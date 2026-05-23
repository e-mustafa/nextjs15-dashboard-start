// ============================================
// 3. Sentry Configuration (Optional)
// ============================================

// lib/monitoring/sentry.ts
import { appConfig, isDEV } from '@/configs/general';
import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';

export function initSentry() {
	if (!appConfig.features.errorReporting) return;

	Sentry.init({
		dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
		environment: process.env.NODE_ENV,

		// Performance Monitoring
		tracesSampleRate: isDEV ? 1.0 : 0.1,

		// Error Sampling
		sampleRate: 1.0,

		// Release tracking
		release: process.env.NEXT_PUBLIC_APP_VERSION,

		// Integrations
		integrations: [
			new Sentry.BrowserTracing({
				tracePropagationTargets: ['localhost', /^\//],
			}),
			new Sentry.Replay({
				maskAllText: true,
				blockAllMedia: true,
			}),
		],

		// Ignore specific errors
		ignoreErrors: ['ResizeObserver loop limit exceeded', 'Non-Error promise rejection captured'],

		// Custom error filtering
		beforeSend(event, hint) {
			// Don't send errors in development
			if (isDEV) return null;

			// Filter out known issues
			if (event.exception) {
				const error = hint.originalException;
				if (error && typeof error === 'object' && 'message' in error) {
					const message = String(error.message);

					// Ignore specific messages
					if (message.includes('ChunkLoadError')) {
						return null;
					}
				}
			}

			return event;
		},
	});
}

// Initialize Sentry immediately

export function useSentryMonitoring() {
	useEffect(() => {
		initSentry();
	}, []);
}
