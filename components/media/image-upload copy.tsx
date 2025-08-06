'use client';

import { config_env } from '@/configs/general';
// import { IKImage, ImageKitProvider, IKUpload, IKVideo } from '@imagekit/next';
import { Image, ImageKitProvider } from '@imagekit/next';
import { useRef, useState } from 'react';

const {
	imageKit: { urlEndpoint, publicKey },
} = config_env;

async function authenticator() {
	try {
		const response = await fetch(`${config_env.domainAPI}/auth/imagekit`);
		if (!response.ok) {
			const errorText = await response.text();
			throw new Error(`ImageKit request failed with status ${response.status}: ${errorText}`);
		}
		const data = await response.json();
		console.log('imageKit data:', data);
		const { signature, expire, token } = data;
		// imageKit.setAuth(signature, expire, token);
		console.log('ImageKit initialized successfully');
		return { signature, expire, token };
	} catch (error: any) {
		console.error('Error initializing ImageKit:', error);
		throw new Error(`Authentication request failed: ${error.message}`);
	}
}

export default function ImageUpload() {
	const IKUploadRef = useRef(null);
	const [file, setFile] = useState<{ filePath: string } | null>(null);

	const onError = (error: any) => { };
	const onSuccess = (result: any) => {
		console.log('File uploaded successfully:', result);
		setFile({ filePath: result.url });
	};

	const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		if (event.target.files && event.target.files[0]) {
			const selectedFile = event.target.files[0];
			setFile({ filePath: URL.createObjectURL(selectedFile) });
		}
	};
	return (
		<ImageKitProvider urlEndpoint={urlEndpoint} publicKey={publicKey} authenticator={authenticator}>
			{/* <upload ref={IKUploadRef} className='hidden' /> */}

			<Upload
				ref={IKUploadRef}
				onError={onError}
				onSuccess={onSuccess}
				className='hidden'
				folder='/uploads'
				multiple={false}
			/>

			<input type='file' onChange={handleFileChange} accept='image/*' className='mb-4' />

			<Image src='/profile.png' width={500} height={500} alt='Picture of the author' />
		</ImageKitProvider>
	);
}
export const imageUploadConfig = {
	maxFileSize: 5 * 1024 * 1024, // 5 MB
	allowedFormats: ['image/jpeg', 'image/png', 'image/gif'],
	imageKitUrl: urlEndpoint,
};
