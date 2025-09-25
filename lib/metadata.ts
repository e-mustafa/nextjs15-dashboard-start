// lib/db.ts
import type { Metadata } from 'next';

// محاكاة قاعدة بيانات
const fakeDB: Record<string, Metadata> = {
	en: {
		title: 'Welcome to My App',
		description: 'English description for the app',
		openGraph: {
			title: 'My App EN',
			description: 'Open Graph EN',
			url: 'https://example.com/en',
			siteName: 'My App',
			images: [
				{
					url: 'https://example.com/og-en.png',
					width: 1200,
					height: 630,
					alt: 'OG Image EN',
				},
			],
			locale: 'en_US',
			type: 'website',
		},
		twitter: {
			card: 'summary_large_image',
			title: 'My App EN',
			description: 'Twitter description EN',
			images: ['https://example.com/twitter-en.png'],
		},
	},
	ar: {
		title: 'مرحبا بك في تطبيقي',
		description: 'الوصف العربي للتطبيق',
		openGraph: {
			title: 'تطبيقي AR',
			description: 'وصف Open Graph بالعربية',
			url: 'https://example.com/ar',
			siteName: 'تطبيقي',
			images: [
				{
					url: 'https://example.com/og-ar.png',
					width: 1200,
					height: 630,
					alt: 'OG Image AR',
				},
			],
			locale: 'ar_AR',
			type: 'website',
		},
		twitter: {
			card: 'summary_large_image',
			title: 'تطبيقي',
			description: 'وصف تويتر بالعربية',
			images: ['https://example.com/twitter-ar.png'],
		},
	},
};

export async function getMetadataByLocale(locale: string): Promise<Metadata> {
	// في الحقيقة تستبدل هذا باستعلام Prisma أو ORM
	return fakeDB[locale] ?? fakeDB['en'];
}
