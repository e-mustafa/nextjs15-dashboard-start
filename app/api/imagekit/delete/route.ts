import { errorHandler } from '@/lib/error-handler/error-handler-route';
import { AppError } from '@/lib/error-handler/error-handler.server';
import imagekit from '@/lib/utils.server/imagekit.server';
import { prisma_DB } from '@/prisma/prisma.db';

/**
 * DELETE /api/imagekit/delete
 *
 * Deletes an image from ImageKit and database.
 *
 * @param {Request} req - Request object containing the fileId of the image to delete.
 *
 * @returns {Promise<NextResponse>} NextResponse object containing the result of the deletion.
 *
 * @throws {AppError} If the image is not found or if the image is in use.
 */

// handler العادي
async function deleteImageAction(req: Request) {
	const { fileId } = await req.json();

	if (!fileId) {
		throw new AppError('api.errors.file_id_required', 400);
	}

	// search in DB if the image is in use
	const image = await prisma_DB.image.findUnique({
		where: { fileId },
		include: {
			brands: true,
			users: true,
			products: true,
		},
	});

	if (!image) {
		throw new AppError('api.errors.image_not_found', 404);
	}

	// if the image is in use -> do not delete
	if ((image.brands?.length ?? 0) > 0 || (image.users?.length ?? 0) > 0 || (image.products?.length ?? 0) > 0) {
		throw new AppError('api.errors.image_in_use', 409);
	}

	// delete from ImageKit
	await imagekit.deleteFile(fileId);

	// delete from DB
	await prisma_DB.image.delete({ where: { fileId } });

	return {
		success: true,
		status: 200,
		data: null,
		message: 'api.success.image_deleted',
	};
}

// export routes
export const { DELETE } = errorHandler({
	DELETE: deleteImageAction,
});
