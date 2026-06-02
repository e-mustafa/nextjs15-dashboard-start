// This file provides a utility function to parse and validate common query parameters for list endpoints in the application, such as pagination, sorting, and searching. By centralizing this logic, we can ensure consistent behavior across different services and reduce boilerplate code in individual service functions.

export interface BaseListParams {
	page?: number | string;
	limit?: number | string;
	search?: string;
	sortBy?: string;
	sortOrder?: 'asc' | 'desc';
}

// utility function centralizes the parsing and validation of common query parameters for list endpoints, ensuring consistent behavior across the application and reducing boilerplate in individual service functions.
interface ParseConfig<T extends string> {
	sortableFields: T[];
	defaultSortBy?: T;
	defaultSortOrder?: 'asc' | 'desc';
	maxLimit?: number;
}

export function parseListParams<T extends string>(params: BaseListParams | undefined, config: ParseConfig<T>) {
	const { sortableFields, defaultSortBy = sortableFields[0] || 'createdAt', defaultSortOrder, maxLimit } = config;
	// 1. handle pagination and limit with protection against negative or excessively large values
	const page = Math.max(1, Number(params?.page) || 1);
	const limit = Math.min(maxLimit || 100, Math.max(1, Number(params?.limit) || 10));
	const skip = (page - 1) * limit;

   // 2. Clean up search query by trimming whitespace and defaulting to empty string if not provided
	const search = params?.search?.trim() || '';

   // 3. Validate sortBy against allowed fields and apply default if invalid or not provided
	const sortBy = sortableFields.includes(params?.sortBy as T) ? (params?.sortBy as T) : defaultSortBy;

   // 4. Determine sort order with a default fallback
	const defaultOrder = defaultSortOrder || 'asc';
	const sortOrder = params?.sortOrder === 'asc' || params?.sortOrder === 'desc' ? params.sortOrder : defaultOrder;

	return { page, limit, skip, search, sortBy, sortOrder };
}
