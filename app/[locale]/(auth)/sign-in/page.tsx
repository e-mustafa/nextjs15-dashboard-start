'use client';

import AuthForm from '@/components/auth/auth-form';
import { AuthFormType } from '@/constant/enums';
import { signinAction } from '@/server/actions/auth';
import { SignInInput, signInSchema } from '@/validation/auth-validation';

export default function SignInPage() {
	return (
		<AuthForm
			type={AuthFormType.SIGN_IN}
			schema={signInSchema}
			defaultValues={{ email: '', password: '' } as SignInInput}
			onSubmit={signinAction} // Placeholder for actual submit logic
		/>
	);
}
