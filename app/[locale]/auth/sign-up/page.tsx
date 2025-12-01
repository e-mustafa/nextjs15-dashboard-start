'use client';
import AuthForm from '@/components/auth/auth-form';
import { AuthFormType } from '@/constant/enums-development';
import { signupAction } from '@/server/actions/auth';
import { signUpSchema } from '@/validation/auth-validation';

export default function SignUpPage() {
	return (
		<AuthForm
			type={AuthFormType.SIGN_UP}
			schema={signUpSchema}
			defaultValues={{
				email: '',
				password: '',
				confirm_password: '',
			}}
			onSubmit={signupAction}
		/>
	);
}
