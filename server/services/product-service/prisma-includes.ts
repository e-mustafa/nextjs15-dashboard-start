export const PRODUCT_COMPLETE_INCLUDE = {
	translations: true,
	brand: { include: { translations: true, images: { include: { image: true } } } },
	category: { include: { translations: true, images: { include: { image: true } } } },
	seoImage: true,
	images: { include: { image: true }, orderBy: { sortOrder: 'asc' as const } },
	variants: {
		include: {
			image: true,
			images: { include: { image: true }, orderBy: { sortOrder: 'asc' as const } },
			options: {
				include: {
					attribute: { include: { translations: true } },
					attributeValue: { include: { translations: true } },
				},
			},
		},
		orderBy: { sortOrder: 'asc' as const },
	},
	attributes: {
		include: {
			attribute: { include: { translations: true } },
			attributeValue: { include: { translations: true } },
		},
	},
	tags: { include: { tag: true } },
	collections: { include: { collection: { include: { translations: true, images: { include: { image: true } } } } } },
	specifications: {
		include: { properties: { orderBy: { sortOrder: 'asc' as const } } },
		orderBy: { sortOrder: 'asc' as const },
	},
	discounts: {
		where: {
			discount: {
				isActive: true,
				startDate: { lte: new Date() },
				OR: [{ endDate: null }, { endDate: { gte: new Date() } }],
			},
		},
		include: { discount: true },
		orderBy: { discount: { priority: 'desc' as const } },
		take: 1,
	},
};
