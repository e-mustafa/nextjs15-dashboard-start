'use client';
import AuthForm from '@/components/auth/auth-form';
import { AuthFormType } from '@/constant/enums';
import { signUpSchema } from '@/validation/auth-validation';

export default function SignUpPage() {
	return (
		<AuthForm
			type={AuthFormType.SIGN_UP}
			schema={signUpSchema}
			defaultValues={{ fullName: '', email: '', password: '' }}
			onSubmit={() => Promise.resolve({ success: true })} // Placeholder for actual submit logic
		/>
	);
}
