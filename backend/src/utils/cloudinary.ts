import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

// Configure Cloudinary with credentials from .env
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export interface CloudinaryUploadResult {
  url: string;
  publicId: string;
  format: string;
  resourceType: string;
}

/**
 * Upload a file from local disk to Cloudinary.
 *
 * @param localPath - Absolute path to the file on disk
 * @param folder    - Cloudinary folder (e.g. "viranikosh/audio")
 * @param mimeType  - MIME type of the file (used to determine resource_type)
 * @returns Cloudinary URL and metadata
 */
export async function uploadToCloudinary(
  localPath: string,
  folder: string,
  mimeType: string
): Promise<CloudinaryUploadResult> {
  // Determine Cloudinary resource_type from MIME type
  let resourceType: "video" | "image" | "raw" = "raw";
  if (mimeType.startsWith("video/")) {
    resourceType = "video";
  } else if (mimeType.startsWith("image/")) {
    resourceType = "image";
  } else if (mimeType.startsWith("audio/")) {
    resourceType = "video"; // Cloudinary uses "video" for audio files
  }

  const result = await cloudinary.uploader.upload(localPath, {
    folder,
    resource_type: resourceType,
    // For video/audio, use eager to generate a playable URL
    ...(resourceType === "video" ? { eager_async: false } : {}),
  });

  return {
    url: result.secure_url,
    publicId: result.public_id,
    format: result.format,
    resourceType,
  };
}

/**
 * Delete a local file (best-effort cleanup).
 */
export async function deleteLocalFile(filePath: string): Promise<void> {
  try {
    await fs.promises.unlink(filePath);
  } catch {
    // Best-effort — file may already be gone
  }
}

export { cloudinary };
