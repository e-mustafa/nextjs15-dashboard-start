import z from 'zod';
import { nameArField, slugSchema } from './fields-validation';

export type TTagFormValues = z.infer<typeof formSchemaTag> & { id?: string };

export const defaultValuesTag = {
	name: '',
	slug: '',
};

export const formSchemaTag = z.object({
	name: nameArField,
	slug: slugSchema('ar'),
});
