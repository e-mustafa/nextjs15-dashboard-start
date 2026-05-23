// ============================================
// Error Rate Alert System
// ============================================

// lib/monitoring/alert-system.ts
import { useEffect } from 'react';
import { toast } from 'sonner';
import { performanceMonitor } from './performance-monitor';

type AlertThreshold = {
	errorRate: number; // percentage
	responseTime: number; // milliseconds
	checkInterval: number; // milliseconds
};

class AlertSystem {
	private thresholds: AlertThreshold = {
		errorRate: 20, // Alert if error rate > 20%
		responseTime: 3000, // Alert if avg response time > 3s
		checkInterval: 30000, // Check every 30 seconds
	};

	private intervalId?: NodeJS.Timeout;
	private alertShown = false;

	start() {
		this.intervalId = setInterval(() => {
			this.checkMetrics();
		}, this.thresholds.checkInterval);
	}

	stop() {
		if (this.intervalId) {
			clearInterval(this.intervalId);
		}
	}

	private checkMetrics() {
		const successRate = performanceMonitor.getSuccessRate();
		const avgDuration = performanceMonitor.getAverageDuration();

		// Check error rate
		if (successRate < 100 - this.thresholds.errorRate && !this.alertShown) {
			this.showAlert(`⚠️ معدل الأخطاء مرتفع: ${(100 - successRate).toFixed(1)}%`, 'error');
			this.alertShown = true;
		}

		// Check response time
		if (avgDuration > this.thresholds.responseTime && !this.alertShown) {
			this.showAlert(`🐌 الاستجابة بطيئة: ${avgDuration.toFixed(0)}ms`, 'warning');
			this.alertShown = true;
		}

		// Reset alert flag if metrics improve
		if (successRate >= 100 - this.thresholds.errorRate && avgDuration <= this.thresholds.responseTime) {
			this.alertShown = false;
		}
	}

	private showAlert(message: string, type: 'error' | 'warning') {
		if (type === 'error') {
			toast.error(message, { duration: 10000 });
		} else {
			toast.warning(message, { duration: 10000 });
		}

		// Log to console
		console.warn('[AlertSystem]', message);

		// Send to monitoring service
		this.sendToMonitoring({ message, type, timestamp: new Date() });
	}

	private sendToMonitoring(alert: any) {
		// Send to Sentry, DataDog, etc.
		if (typeof window !== 'undefined' && window.Sentry) {
			window.Sentry.captureMessage(alert.message, {
				level: alert.type === 'error' ? 'error' : 'warning',
				extra: alert,
			});
		}
	}

	setThresholds(thresholds: Partial<AlertThreshold>) {
		this.thresholds = { ...this.thresholds, ...thresholds };
	}
}

export const alertSystem = new AlertSystem();

export function useAlertSystem() {
	useEffect(() => {
		alertSystem.start();

		return () => {
			alertSystem.stop();
		};
	}, []);
}
