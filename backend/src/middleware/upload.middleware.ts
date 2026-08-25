import path from "path";
import fs from "fs";
import crypto from "crypto";
import multer from "multer";
import { NextFunction, Request, Response } from "express";
import { sendError } from "../utils/apiResponse";

/**
 * Upload configuration — local disk storage for now (swap for object
 * storage in a later iteration without touching the controllers).
 */

export type MediaCategory = "AUDIO" | "VIDEO" | "IMAGE" | "DOCUMENT";

export const UPLOAD_DIR = process.env.UPLOAD_DIR
  ? path.resolve(process.env.UPLOAD_DIR)
  : path.resolve(__dirname, "..", "..", "uploads");

// Hard global ceiling enforced by multer while streaming.
export const MAX_FILE_SIZE = 200 * 1024 * 1024; // 200 MB

// Per-category limits enforced after the file lands on disk.
export const CATEGORY_SIZE_LIMITS: Record<MediaCategory, number> = {
  AUDIO: 50 * 1024 * 1024, // 50 MB
  VIDEO: 200 * 1024 * 1024, // 200 MB
  IMAGE: 10 * 1024 * 1024, // 10 MB
  DOCUMENT: 10 * 1024 * 1024, // 10 MB
};

const MIME_WHITELIST: Record<MediaCategory, string[]> = {
  AUDIO: [
    "audio/mpeg", "audio/wav", "audio/x-wav", "audio/ogg", "audio/mp4",
    "audio/aac", "audio/x-m4a", "audio/flac", "audio/webm",
  ],
  VIDEO: [
    "video/mp4", "video/webm", "video/ogg", "video/quicktime",
    "video/x-matroska", "video/3gpp", "video/3gpp2", "video/x-msvideo",
  ],
  IMAGE: [
    "image/jpeg", "image/png", "image/webp", "image/gif",
    "image/bmp", "image/avif",
  ],
  DOCUMENT: [
    "application/pdf", "text/plain", "text/markdown", "text/csv",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/rtf", "application/json",
  ],
};

const EXTENSION_WHITELIST = new Set([
  "mp3", "wav", "ogg", "m4a", "aac", "flac", "webm",
  "mp4", "mov", "mkv", "avi", "3gp", "3g2",
  "jpg", "jpeg", "png", "webp", "gif", "bmp", "avif",
  "pdf", "txt", "md", "csv", "doc", "docx", "rtf", "json",
]);

function getCategory(mimeType: string): MediaCategory | null {
  for (const [category, mimes] of Object.entries(MIME_WHITELIST)) {
    if (mimes.includes(mimeType)) return category as MediaCategory;
  }
  return null;
}

function getExtension(filename: string): string {
  return path.extname(filename).toLowerCase().replace(".", "");
}

const storage = multer.diskStorage({
  destination: (_req, file, cb) => {
    const category = (file as any).category as MediaCategory;
    const dir = path.join(UPLOAD_DIR, category.toLowerCase());
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (_req, file, cb) => {
    const ext = getExtension(file.originalname) || "bin";
    cb(null, `${Date.now()}-${crypto.randomBytes(8).toString("hex")}.${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE, files: 1 },
  fileFilter: (_req, file, cb) => {
    const category = getCategory(file.mimetype);
    if (!category) {
      cb(new Error(`Unsupported MIME type: ${file.mimetype}`));
      return;
    }
    const ext = getExtension(file.originalname);
    if (!ext || !EXTENSION_WHITELIST.has(ext)) {
      cb(new Error(`Unsupported file extension: ${file.originalname}`));
      return;
    }
    (file as any).category = category;
    cb(null, true);
  },
});

/**
 * Wrapper around `upload.single(fieldName)` that converts multer/validation
 * failures into consistent apiResponse errors (413 for size, 400 otherwise)
 * instead of leaking them to the global handler.
 */
export function uploadSingle(fieldName: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    upload.single(fieldName)(req, res, (err: unknown) => {
      if (!err) {
        next();
        return;
      }

      if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
          sendError(
            res,
            413,
            `File too large. Maximum size is ${Math.floor(MAX_FILE_SIZE / (1024 * 1024))}MB.`
          );
          return;
        }
        sendError(res, 400, `Upload error: ${err.code}`);
        return;
      }

      const message = err instanceof Error ? err.message : "Upload failed.";
      sendError(res, 400, message);
    });
  };
}
