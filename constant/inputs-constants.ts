import { LockIcon, MailIcon, UserIcon } from 'lucide-react';

export const FIELD_DATA = {
	email: {
		label: 'inputs.email_label',
		type: 'text',
		placeholder: 'inputs.email_placeholder',
		description: null,
		startIcon: MailIcon,
		endIcon: null,
		isRequired: true,
		// invalid: 'Invalid email address',
	},
	password: {
		label: 'inputs.password_label',
		type: 'password',
		description: null,
		placeholder: 'inputs.password_placeholder',
		startIcon: LockIcon,
		endIcon: null,
		isRequired: true,
		// invalid: 'Invalid password',
	},

	fullName: {
		label: 'inputs.full_name_label',
		type: 'text',
		description: null,
		placeholder: 'inputs.full_name_placeholder',
		startIcon: UserIcon,
		endIcon: null,
		isRequired: true,
		// invalid: 'Invalid full name',
	},
};
