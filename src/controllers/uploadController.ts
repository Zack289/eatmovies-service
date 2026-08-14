import { Response } from "express";
import streamifier from "streamifier";
import cloudinary, { isCloudinaryConfigured } from "../config/cloudinary";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";
import { AuthedRequest } from "../types";

/** Uploads a poster image to Cloudinary and returns its URL + public ID. */
export const uploadPoster = asyncHandler(async (req: AuthedRequest, res: Response) => {
  if (!isCloudinaryConfigured()) {
    throw new ApiError(
      503,
      "Image uploads aren't configured yet. Add Cloudinary credentials to service/.env."
    );
  }
  if (!req.file) {
    throw new ApiError(400, "No image file was provided");
  }

  const result = await new Promise<{ secure_url: string; public_id: string }>(
    (resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: "eatmovies/posters", resource_type: "image" },
        (error, uploadResult) => {
          if (error || !uploadResult) return reject(error);
          resolve({ secure_url: uploadResult.secure_url, public_id: uploadResult.public_id });
        }
      );
      streamifier.createReadStream(req.file!.buffer).pipe(stream);
    }
  );

  res.status(201).json({
    success: true,
    data: { url: result.secure_url, publicId: result.public_id },
  });
});
