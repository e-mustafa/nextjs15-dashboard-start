import ImageKit from 'imagekit';

const imagekit = new ImageKit({
	publicKey: process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY as string,
	privateKey: process.env.IMAGEKIT_PRIVATE_KEY as string,
	urlEndpoint: process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT as string,
});

export default imagekit;
export const listFiles = (opts = {}) => imagekit.listFiles(opts);
export const deleteFile = (fileId: string) => imagekit.deleteFile(fileId);
export const updateFileDetails = (fileId: string, body: any) => imagekit.updateFileDetails(fileId, body);
