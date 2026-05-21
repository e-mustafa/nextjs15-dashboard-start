import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';
// import { defineConfig, env } from "prisma";
console.log('DATABASE_URL: ', process.env.DATABASE_URL);

export default defineConfig({
	schema: './prisma/schema.prisma',
	datasource: {
		url: env('DATABASE_URL'),
	},
	// migrations: {
	// 	path: './prisma/migrations',
	// },
});
