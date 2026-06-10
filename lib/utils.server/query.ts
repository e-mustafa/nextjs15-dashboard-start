export interface BaseListParams {
	page?: number | string;
	limit?: number | string;
	search?: string;
	sortBy?: string;
	sortOrder?: 'asc' | 'desc';
}

interface ParseConfig<T extends string> {
	sortableFields: T[];
	defaultSortBy?: T;
	defaultSortOrder?: 'asc' | 'desc';
	maxLimit?: number;
}

export function parseListParams<T extends string>(params: BaseListParams | undefined, config: ParseConfig<T>) {
	const { sortableFields, defaultSortBy = 'createdAt', defaultSortOrder = 'asc', maxLimit } = config;

	// 1. handle pagination and limit with protection against negative or excessively large values
	const page = Math.max(1, Number(params?.page) || 1);
	const limit = Math.min(maxLimit || 100, Math.max(1, Number(params?.limit) || 10));
	const skip = (page - 1) * limit;

	// 2. Clean up search query by trimming whitespace and defaulting to empty string if not provided
	const search = params?.search?.trim() || '';

	// 3. Validate sortBy against allowed fields and apply default if invalid or not provided
	const sortBy = params?.sortBy && sortableFields.includes(params.sortBy as T) ? (params.sortBy as T) : defaultSortBy;

	// 4. Determine sort order with a default fallback
	const sortOrder = params?.sortOrder === 'asc' || params?.sortOrder === 'desc' ? params.sortOrder : defaultSortOrder;

	return { page, limit, skip, search, sortBy, sortOrder };
}
