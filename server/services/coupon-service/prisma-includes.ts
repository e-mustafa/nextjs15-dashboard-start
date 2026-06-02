export const couponWithRelationsInclude = {
	translations: true,
	products: {
		include: {
			product: {
				include: {
					translations: true,
					images: { include: { image: true } },
				},
			},
		},
	},
	categories: {
		include: {
			category: {
				include: {
					translations: true,
					images: { include: { image: true } },
				},
			},
		},
	},
	collections: {
		include: {
			collection: {
				include: {
					translations: true,
					images: { include: { image: true } },
				},
			},
		},
	},
	usages: true,
};
