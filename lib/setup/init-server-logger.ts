// ✅ init-server-logger.ts
// هذا الملف يقوم بتحميل logger.global مرة واحدة فقط عند تشغيل السيرفر

if (process.env.NEXT_RUNTIME === 'edge') {
	console.warn('🟡 Skipping global logger initialization (Edge Runtime)');
} else {
	// ✅ استدعاء logger.global فقط في runtime العادي
	import('@/lib/logs/logger.global')
		.then(() => {
			console.log('✅ Global logger initialized');
		})
		.catch((err) => {
			console.error('❌ Failed to initialize global logger:', err);
		});
}
