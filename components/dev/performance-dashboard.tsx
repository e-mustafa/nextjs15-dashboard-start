// ============================================
// Performance Dashboard Component
// ============================================

// components/dev/performance-dashboard.tsx
'use client';

import { useEffect, useState } from 'react';
import { performanceMonitor } from '@/lib/monitoring/performance-monitor';

export function PerformanceDashboard() {
	const [metrics, setMetrics] = useState(performanceMonitor.getMetrics());

	useEffect(() => {
		const interval = setInterval(() => {
			setMetrics(performanceMonitor.getMetrics());
		}, 1000);

		return () => clearInterval(interval);
	}, []);

	const avgDuration = performanceMonitor.getAverageDuration();
	const successRate = performanceMonitor.getSuccessRate();
	const slowestActions = performanceMonitor.getSlowestActions();
	const failedActions = performanceMonitor.getMostFailedActions();

	return (
		<div className='fixed bottom-4 right-4 bg-white dark:bg-gray-800 shadow-lg rounded-lg p-4 max-w-md z-50'>
			<h3 className='text-lg font-bold mb-3'>Performance Monitor</h3>

			<div className='grid grid-cols-2 gap-4 mb-4'>
				<div className='bg-blue-50 dark:bg-blue-900/20 p-3 rounded'>
					<div className='text-xs text-gray-600 dark:text-gray-400'>Avg Duration</div>
					<div className='text-2xl font-bold text-blue-600'>{avgDuration.toFixed(0)}ms</div>
				</div>

				<div className='bg-green-50 dark:bg-green-900/20 p-3 rounded'>
					<div className='text-xs text-gray-600 dark:text-gray-400'>Success Rate</div>
					<div className='text-2xl font-bold text-green-600'>{successRate.toFixed(1)}%</div>
				</div>
			</div>

			<div className='mb-4'>
				<h4 className='text-sm font-semibold mb-2'>Slowest Actions</h4>
				<div className='space-y-1'>
					{slowestActions.map((metric, i) => (
						<div key={i} className='flex justify-between text-xs bg-gray-50 dark:bg-gray-700 p-2 rounded'>
							<span className='truncate'>{metric.action}</span>
							<span className='font-mono'>{metric.duration.toFixed(0)}ms</span>
						</div>
					))}
				</div>
			</div>

			<div>
				<h4 className='text-sm font-semibold mb-2'>Failed Actions</h4>
				<div className='space-y-1'>
					{failedActions.map((item, i) => (
						<div key={i} className='flex justify-between text-xs bg-red-50 dark:bg-red-900/20 p-2 rounded'>
							<span className='truncate'>{item.action}</span>
							<span className='font-mono text-red-600'>{item.count}x</span>
						</div>
					))}
				</div>
			</div>

			<button
				onClick={() => performanceMonitor.clear()}
				className='mt-3 w-full text-xs py-2 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600'
			>
				Clear Metrics
			</button>
		</div>
	);
}

// Usage: Add to layout in development mode
// {isDEV && <PerformanceDashboard />}
