// lib/monitoring/performance-monitor.ts

type PerformanceMetric = {
	action: string;
	duration: number;
	success: boolean;
	timestamp: Date;
	error?: string;
};

class PerformanceMonitor {
	private metrics: PerformanceMetric[] = [];
	private maxMetrics = 100;

	recordMetric(metric: PerformanceMetric) {
		this.metrics.push(metric);

		// Keep only last N metrics
		if (this.metrics.length > this.maxMetrics) {
			this.metrics.shift();
		}

		// Send to analytics service
		this.sendToAnalytics(metric);
	}

	private sendToAnalytics(metric: PerformanceMetric) {
		// Send to Google Analytics, Mixpanel, etc.
		if (typeof window !== 'undefined' && window.gtag) {
			window.gtag('event', 'server_action', {
				action_name: metric.action,
				duration: metric.duration,
				success: metric.success,
				error: metric.error,
			});
		}
	}

	getMetrics() {
		return this.metrics;
	}

	getAverageDuration(action?: string) {
		const filtered = action ? this.metrics.filter((m) => m.action === action) : this.metrics;

		if (filtered.length === 0) return 0;

		const total = filtered.reduce((sum, m) => sum + m.duration, 0);
		return total / filtered.length;
	}

	getSuccessRate(action?: string) {
		const filtered = action ? this.metrics.filter((m) => m.action === action) : this.metrics;

		if (filtered.length === 0) return 0;

		const successCount = filtered.filter((m) => m.success).length;
		return (successCount / filtered.length) * 100;
	}

	getSlowestActions(limit = 5) {
		return [...this.metrics].sort((a, b) => b.duration - a.duration).slice(0, limit);
	}

	getMostFailedActions(limit = 5) {
		const failedActions = this.metrics.filter((m) => !m.success);
		const grouped = failedActions.reduce((acc, metric) => {
			acc[metric.action] = (acc[metric.action] || 0) + 1;
			return acc;
		}, {} as Record<string, number>);

		return Object.entries(grouped)
			.sort(([, a], [, b]) => b - a)
			.slice(0, limit)
			.map(([action, count]) => ({ action, count }));
	}

	clear() {
		this.metrics = [];
	}
}

export const performanceMonitor = new PerformanceMonitor();

// // ============================================
// // Enhanced useServerAction with Monitoring
// // ============================================

// // hooks/use-server-action-monitored.ts
// import { useCallback } from 'react';
// import { useServerAction } from './use-server-action';
// import { performanceMonitor } from '@/lib/monitoring/performance-monitor';

// export function useServerActionMonitored<T = any>(actionName?: string) {
// 	const { execute, isPending, error } = useServerAction<T>();

// 	const executeMonitored = useCallback(
// 		async (action: () => Promise<ActionResult<T>>, options?: ServerActionOptions<T>) => {
// 			const startTime = performance.now();
// 			const name = actionName || action.name || 'unknown';

// 			try {
// 				const result = await execute(action, options);
// 				const duration = performance.now() - startTime;

// 				performanceMonitor.recordMetric({
// 					action: name,
// 					duration,
// 					success: result.success,
// 					timestamp: new Date(),
// 					error: result.error,
// 				});

// 				return result;
// 			} catch (err) {
// 				const duration = performance.now() - startTime;

// 				performanceMonitor.recordMetric({
// 					action: name,
// 					duration,
// 					success: false,
// 					timestamp: new Date(),
// 					error: err instanceof Error ? err.message : 'Unknown error',
// 				});

// 				throw err;
// 			}
// 		},
// 		[execute, actionName]
// 	);

// 	return { execute: executeMonitored, isPending, error };
// }

// // ============================================
// // Performance Dashboard Component
// // ============================================

// // components/dev/performance-dashboard.tsx
// 'use client';

// import { useEffect, useState } from 'react';
// import { performanceMonitor } from '@/lib/monitoring/performance-monitor';

// export function PerformanceDashboard() {
// 	const [metrics, setMetrics] = useState(performanceMonitor.getMetrics());

// 	useEffect(() => {
// 		const interval = setInterval(() => {
// 			setMetrics(performanceMonitor.getMetrics());
// 		}, 1000);

// 		return () => clearInterval(interval);
// 	}, []);

// 	const avgDuration = performanceMonitor.getAverageDuration();
// 	const successRate = performanceMonitor.getSuccessRate();
// 	const slowestActions = performanceMonitor.getSlowestActions();
// 	const failedActions = performanceMonitor.getMostFailedActions();

// 	return (
// 		<div className='fixed bottom-4 right-4 bg-white dark:bg-gray-800 shadow-lg rounded-lg p-4 max-w-md z-50'>
// 			<h3 className='text-lg font-bold mb-3'>Performance Monitor</h3>

// 			<div className='grid grid-cols-2 gap-4 mb-4'>
// 				<div className='bg-blue-50 dark:bg-blue-900/20 p-3 rounded'>
// 					<div className='text-xs text-gray-600 dark:text-gray-400'>Avg Duration</div>
// 					<div className='text-2xl font-bold text-blue-600'>{avgDuration.toFixed(0)}ms</div>
// 				</div>

// 				<div className='bg-green-50 dark:bg-green-900/20 p-3 rounded'>
// 					<div className='text-xs text-gray-600 dark:text-gray-400'>Success Rate</div>
// 					<div className='text-2xl font-bold text-green-600'>{successRate.toFixed(1)}%</div>
// 				</div>
// 			</div>

// 			<div className='mb-4'>
// 				<h4 className='text-sm font-semibold mb-2'>Slowest Actions</h4>
// 				<div className='space-y-1'>
// 					{slowestActions.map((metric, i) => (
// 						<div key={i} className='flex justify-between text-xs bg-gray-50 dark:bg-gray-700 p-2 rounded'>
// 							<span className='truncate'>{metric.action}</span>
// 							<span className='font-mono'>{metric.duration.toFixed(0)}ms</span>
// 						</div>
// 					))}
// 				</div>
// 			</div>

// 			<div>
// 				<h4 className='text-sm font-semibold mb-2'>Failed Actions</h4>
// 				<div className='space-y-1'>
// 					{failedActions.map((item, i) => (
// 						<div key={i} className='flex justify-between text-xs bg-red-50 dark:bg-red-900/20 p-2 rounded'>
// 							<span className='truncate'>{item.action}</span>
// 							<span className='font-mono text-red-600'>{item.count}x</span>
// 						</div>
// 					))}
// 				</div>
// 			</div>

// 			<button
// 				onClick={() => performanceMonitor.clear()}
// 				className='mt-3 w-full text-xs py-2 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600'
// 			>
// 				Clear Metrics
// 			</button>
// 		</div>
// 	);
// }

// // Usage: Add to layout in development mode
// // {isDEV && <PerformanceDashboard />}

// // ============================================
// // Error Rate Alert System
// // ============================================

// // lib/monitoring/alert-system.ts
// import { toast } from 'sonner';

// type AlertThreshold = {
// 	errorRate: number; // percentage
// 	responseTime: number; // milliseconds
// 	checkInterval: number; // milliseconds
// };

// class AlertSystem {
// 	private thresholds: AlertThreshold = {
// 		errorRate: 20, // Alert if error rate > 20%
// 		responseTime: 3000, // Alert if avg response time > 3s
// 		checkInterval: 30000, // Check every 30 seconds
// 	};

// 	private intervalId?: NodeJS.Timeout;
// 	private alertShown = false;

// 	start() {
// 		this.intervalId = setInterval(() => {
// 			this.checkMetrics();
// 		}, this.thresholds.checkInterval);
// 	}

// 	stop() {
// 		if (this.intervalId) {
// 			clearInterval(this.intervalId);
// 		}
// 	}

// 	private checkMetrics() {
// 		const successRate = performanceMonitor.getSuccessRate();
// 		const avgDuration = performanceMonitor.getAverageDuration();

// 		// Check error rate
// 		if (successRate < 100 - this.thresholds.errorRate && !this.alertShown) {
// 			this.showAlert(`⚠️ معدل الأخطاء مرتفع: ${(100 - successRate).toFixed(1)}%`, 'error');
// 			this.alertShown = true;
// 		}

// 		// Check response time
// 		if (avgDuration > this.thresholds.responseTime && !this.alertShown) {
// 			this.showAlert(`🐌 الاستجابة بطيئة: ${avgDuration.toFixed(0)}ms`, 'warning');
// 			this.alertShown = true;
// 		}

// 		// Reset alert flag if metrics improve
// 		if (successRate >= 100 - this.thresholds.errorRate && avgDuration <= this.thresholds.responseTime) {
// 			this.alertShown = false;
// 		}
// 	}

// 	private showAlert(message: string, type: 'error' | 'warning') {
// 		if (type === 'error') {
// 			toast.error(message, { duration: 10000 });
// 		} else {
// 			toast.warning(message, { duration: 10000 });
// 		}

// 		// Log to console
// 		console.warn('[AlertSystem]', message);

// 		// Send to monitoring service
// 		this.sendToMonitoring({ message, type, timestamp: new Date() });
// 	}

// 	private sendToMonitoring(alert: any) {
// 		// Send to Sentry, DataDog, etc.
// 		if (typeof window !== 'undefined' && window.Sentry) {
// 			window.Sentry.captureMessage(alert.message, {
// 				level: alert.type === 'error' ? 'error' : 'warning',
// 				extra: alert,
// 			});
// 		}
// 	}

// 	setThresholds(thresholds: Partial<AlertThreshold>) {
// 		this.thresholds = { ...this.thresholds, ...thresholds };
// 	}
// }

// export const alertSystem = new AlertSystem();
