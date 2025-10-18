import { isDEV, logsConfigs, TLocalesData } from '@/configs/general';
import path from 'path';
import winston from 'winston';
import 'winston-daily-rotate-file';
import { translateServerMessage } from '../utils.server/translate-logs.server';

// ✅ Singleton to prevent re-creation
const globalForLogger = global as unknown as { _appLogger?: winston.Logger };

if (!globalForLogger._appLogger) {
	const logDir = path.join(process.cwd(), 'logs');
	const defaultNamespaces = ['common'];

	const makeTransport = (name: string) =>
		new winston.transports.DailyRotateFile({
			filename: path.join(logDir, `${name}-%DATE%.log`),
			datePattern: 'YYYY-MM',
			maxSize: '2m',
			maxFiles: '6',
			zippedArchive: true,
		});

	const loggerInstance = winston.createLogger({
		level: isDEV ? 'debug' : 'info',
		format: winston.format.combine(
			winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
			winston.format.printf(
				({
					timestamp,
					level,
					message,
					context,
					key,
					locale = logsConfigs.defaultLocale,
					namespaces = defaultNamespaces,
				}) => {
					const translated = key
						? translateServerMessage(key as string, namespaces as string[], locale as TLocalesData)
						: message;
					const ctx = context ? ` [${context}]` : '';
					const keyText = key ? ` (${key})` : '';
					return `[${timestamp}] ${level}${ctx}: ${translated}${keyText}`;
				}
			)
		),
		transports: [
			new winston.transports.Console({
				level: isDEV ? 'debug' : 'info',
				format: winston.format.combine(winston.format.colorize(), winston.format.simple()),
			}),
			makeTransport('app'),
			makeTransport('error'),
			makeTransport('db'),
			makeTransport('api'),
		],
	});

	globalForLogger._appLogger = loggerInstance;
}

export const logger = globalForLogger._appLogger!;
