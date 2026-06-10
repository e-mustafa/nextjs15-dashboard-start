// Shared Prisma include block for discounts to prevent duplication
export const discountWithRelationsInclude = {
	translations: true,
	products: {
		include: {
			product: {
				include: {
					translations: { select: { lang: true, name: true } },
					images: { include: { image: true }, orderBy: { sortOrder: 'asc' }, take: 1 },
				},
			},
		},
	},
} as const;
