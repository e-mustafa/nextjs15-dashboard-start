// types/api.ts

// image object in api
export type TImage = { id?: string; url: string; fileId: string; createdAt?: Date } | null;

/**
 * Standard API Response Structure
 */
export type ActionResult<T = any> = {
	success: boolean;
	status: number;
	data?: T | T[] | undefined;
	error?: string | undefined;
	details?: any;
	message?: string | undefined;
	form_errors?: string | undefined;
	total?: number | undefined;
	meta?: ApiMeta | undefined;
	redirect_to?: string;
};

/**
 * API Metadata
 */
export type ApiMeta = {
	pagination?: {
		page: number;
		limit: number;
		total: number;
		totalPages: number;
	};
	sort?: {
		by: string;
		order: 'asc' | 'desc';
	};
	query?: {
		search?: string;
		filters?: Record<string, any>;
	};
};

/**
 * Query Parameters for API Requests
 */
export type TQueryParams = {
	page?: number;
	limit?: number;
	search?: string;
	sortBy?: string;
	sortOrder?: 'asc' | 'desc';
	filters?: Record<string, any>;
};

/**
 * Server Action Options
 */
export type ServerActionOptions<T = any> = {
	onSuccess?: (data?: T | T[]) => void;
	onError?: (error: string) => void;
	successMessage?: string;
	showSuccessToast?: boolean;
	showErrorToast?: boolean;
	optimisticUpdate?: () => void;
};

/**
 * Form Handler Options
 */
export type FormHandlerOptions = {
	redirectTo?: string;
	resetOnSuccess?: boolean;
	onSuccess?: () => void;
	onError?: () => void;
};

/**
 * Result Handler Options
 */
export type ResultHandlerOptions = {
	successMessage?: string;
	onSuccess?: () => void;
	onError?: () => void;
	showSuccessToast?: boolean;
	showErrorToast?: boolean;
};

// ============================================
// Utility Types
// ============================================

/**
 * Extract data type from ActionResult
 */
export type ExtractResultData<T> = T extends ActionResult<infer U> ? U : never;

/**
 * Make ActionResult properties required
 */
export type RequiredActionResult<T> = Required<ActionResult<T>>;

/**
 * ActionResult with guaranteed data
 */
export type SuccessActionResult<T> = ActionResult<T> & {
	success: true;
	data: T | T[];
};

/**
 * ActionResult with guaranteed error
 */
export type ErrorActionResult = ActionResult & {
	success: false;
	error: string;
};

// ============================================
// Type Guards
// ============================================

/**
 * Check if result is successful
 */
export function isSuccessResult<T>(result: ActionResult<T>): result is SuccessActionResult<T> {
	return result.success === true && result.data !== undefined;
}

/**
 * Check if result is error
 */
export function isErrorResult(result: ActionResult): result is ErrorActionResult {
	return result.success === false && result.error !== undefined;
}

/**
 * Check if result has form errors
 */
export function hasFormErrors(result: ActionResult): boolean {
	return !result.success && !!result.form_errors;
}

// ============================================
// Window Extensions for Global Types
// ============================================

declare global {
	interface Window {
		gtag?: (...args: any[]) => void;
		Sentry?: {
			captureException: (error: Error, context?: any) => void;
			captureMessage: (message: string, context?: any) => void;
		};
	}
}

// ============================================
// Example Usage
// ============================================

/*
// Type-safe server action
export async function getBrandsAction(): Promise<ActionResult<Brand>> {
	return runAction(async () => {
		const brands = await prisma.brand.findMany();
		
		return {
			success: true,
			status: 200,
			data: brands,
		};
	});
}

// Using with type guard
const result = await getBrandsAction();

if (isSuccessResult(result)) {
	// TypeScript knows result.data is Brand | Brand[]
	console.log(result.data);
}

if (isErrorResult(result)) {
	// TypeScript knows result.error is string
	console.log(result.error);
}

// Extract data type
type BrandData = ExtractResultData<typeof result>;
*/
