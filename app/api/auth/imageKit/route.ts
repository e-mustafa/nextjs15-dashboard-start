import { config_env } from '@/configs/general';
import ImageKit from 'imagekit';
import { NextResponse } from 'next/server';

const {
	imageKit: { privateKey, publicKey, urlEndpoint },
} = config_env;

export const imageKit = new ImageKit({ privateKey, publicKey, urlEndpoint });


export async function GET() {
	// Your application logic to authenticate the user
	// For example, you can check if the user is logged in or has the necessary permissions
	// If the user is not authenticated, you can return an error response

	// const { token, expire, signature } = getUploadAuthParams({
	// 	privateKey: privateKey, // Never expose this on client side
	// 	publicKey: publicKey, // This can be exposed on client side
	// 	// expire: 30 * 60, // Optional, controls the expiry time of the token in seconds, maximum 1 hour in the future
	// 	// token: "random-token", // Optional, a unique token for request
	// });

	// return Response.json({ token, expire, signature, publicKey });
	return NextResponse.json(imageKit.getAuthenticationParameters());
}
