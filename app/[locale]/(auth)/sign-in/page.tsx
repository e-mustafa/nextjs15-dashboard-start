'use client';

import AuthForm from '@/components/auth/auth-form';
import { AuthFormType } from '@/constant/enums';
import { signInSchema } from '@/validation/auth-validation';

export default function SignInPage() {
	return (
		<AuthForm
			type={AuthFormType.SIGN_IN}
			schema={signInSchema}
			defaultValues={{ email: '', password: '' }}
			onSubmit={() => Promise.resolve({ success: true })} // Placeholder for actual submit logic
		/>
	);
}
