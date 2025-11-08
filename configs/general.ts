import { Environments } from '@/constant/enums';

export const localesData = {
	ar: {
		short: 'ar',
		dir: 'rtl',
		label: 'العربية',
		flag: '/assets/images/lang_ar_flag_arabic.svg',
	},
	en: {
		short: 'en',
		dir: 'ltr',
		label: 'English',
		flag: '/assets/images/lang_en_flag_english.svg',
	},
} as const;
export type TLocalesData = keyof typeof localesData;
export const defaultLocale = localesData['ar'];

export const logsConfigs = {
	defaultLocale: defaultLocale.short as TLocalesData,
	defaultNamespaces: ['general'],
	transport: 'file',
	level: 'info',
	dir: './logs',
	file: 'app.log',
	maxSize: 5 * 1024 * 1024, // 5MB
	maxFiles: 5, // keep last 5 files
};

export const nextRevalidateData = 60;

export const config_env = {
	environment: process.env.NODE_ENV!,
	domain: process.env.NEXT_PUBLIC_DOMAIN!,
	domainAPI: process.env.NEXT_PUBLIC_APP_URL!,
	imageKit: {
		urlEndpoint: process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT!,
		publicKey: process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY!,
		privateKey: process.env.IMAGEKIT_PRIVATE_KEY!,
	},
};

export const isDEV = process.env.NODE_ENV === Environments.DEV;
export const isPROD = process.env.NODE_ENV === Environments.PROD;


export const appConfig = {
	// Feature flags
	features: {
		monitoring: process.env.NEXT_PUBLIC_ENABLE_MONITORING === 'true',
		errorReporting: process.env.NEXT_PUBLIC_ENABLE_ERROR_REPORTING === 'true',
		performanceDashboard: isDEV && process.env.NEXT_PUBLIC_ENABLE_PERFORMANCE_DASHBOARD === 'true',
	},

	// Toast configuration
	toast: {
		position: 'top-center' as const,
		duration: 3000,
		richColors: true,
		closeButton: true,
	},

	// Performance monitoring
	performance: {
		enabled: isDEV,
		maxMetrics: 100,
		alertThresholds: {
			errorRate: 20, // percentage
			responseTime: 3000, // milliseconds
			checkInterval: 30000, // milliseconds
		},
	},

	// Request configuration
	request: {
		timeout: 30000, // 30 seconds
		retryAttempts: 3,
		retryDelay: 1000, // milliseconds
	},

	// Rate limiting
	rateLimit: {
		enabled: isPROD,
		maxRequests: 100,
		windowMs: 60000, // 1 minute
	},
};


export const imagesPlaceholder = {
	imgMedium: '/assets/images/placeholders/placeholder-612x612.webp',
	// blur: 10,
	// base64: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+ip1sAAAAASUVORK5CYII=',
};



// settings
// redirect after create item
// redirect after update item