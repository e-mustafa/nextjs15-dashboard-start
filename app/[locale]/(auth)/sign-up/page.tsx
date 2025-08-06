'use client';
import AuthForm from '@/components/auth/auth-form';
import { AuthFormType } from '@/constant/enums';
import { signUpSchema } from '@/validation/auth-validation';
import { ZodString } from 'zod';

export default function SignUpPage() {
	// const users = await prisma_DB.user.findMany();
	// console.log('users', users);

	return (
		<AuthForm
			type={AuthFormType.SIGN_UP}
			schema={signUpSchema}
			defaultValues={{
				// name: '' as unknown as ZodString,
				// name: '' as unknown as ZodString,
				email: '' as unknown as ZodString,
				password: '' as unknown as ZodString,
				confirm_password: '' as unknown as ZodString,
			}}
			onSubmit={signUpSchema} // Placeholder for actual submit logic
		/>
	);
}
