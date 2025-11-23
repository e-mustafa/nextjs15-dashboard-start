import { SpecificationSection } from '@/server/services/product-service';

export interface SpecificationSectionFront extends SpecificationSection {
	isEditing: boolean;
}

// Helper function to transform data from backend
export function transformSpecificationsFromBackend(backendSpecs: SpecificationSection[]): SpecificationSectionFront[] {
	return backendSpecs.map((spec) => ({
		id: spec.id,
		title_ar: spec.title_ar,
		title_en: spec.title_en,
		properties: spec.properties.map((prop) => ({
			id: prop.id,
			key_ar: prop.key_ar,
			key_en: prop.key_en,
			value_ar: prop.value_ar,
			value_en: prop.value_en,
		})),
		isEditing: false,
	}));
}

export function transformSpecificationsToBackend(specifications: SpecificationSectionFront[]): SpecificationSection[] {
	return specifications
		.map((section) => {
			// Clean properties
			const cleanedProperties = section.properties
				.filter((prop) => {
					const hasKey = prop.key_ar?.trim() || prop.key_en?.trim();
					const hasValue = prop.value_ar?.trim() || prop.value_en?.trim();
					return hasKey && hasValue;
				})
				.map((prop) => ({
					id: prop.id,
					key_ar: prop.key_ar?.trim() || '',
					key_en: prop.key_en?.trim() || '',
					value_ar: prop.value_ar?.trim() || '',
					value_en: prop.value_en?.trim() || '',
				}));

			return {
				id: section.id,
				title_ar: section.title_ar?.trim() || '',
				title_en: section.title_en?.trim() || '',
				properties: cleanedProperties,
			};
		})
		.filter((section) => section.properties.length > 0);
}
