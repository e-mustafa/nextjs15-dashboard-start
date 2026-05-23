// lib/rate-limit.ts
import { appConfig } from '@/configs/general';
import { Redis } from '@upstash/redis';

const redis = new Redis({
	url: process.env.UPSTASH_REDIS_REST_URL!,
	token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export async function rateLimit(identifier: string, limit = 100, windowMs = 60000) {
	if (!appConfig.rateLimit.enabled) {
		return { success: true, remaining: limit };
	}

	const key = `rate_limit:${identifier}`;
	const now = Date.now();
	const windowStart = now - windowMs;

	// Remove old entries
	await redis.zremrangebyscore(key, 0, windowStart);

	// Count requests in current window
	const count = await redis.zcard(key);

	if (count >= limit) {
		return { success: false, remaining: 0 };
	}

	// Add current request
	await redis.zadd(key, { score: now, member: `${now}` });
	await redis.expire(key, Math.ceil(windowMs / 1000));

	return { success: true, remaining: limit - count - 1 };
}
