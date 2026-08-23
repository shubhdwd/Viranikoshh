import { Request, Response, NextFunction } from "express";
import path from "path";
import { ZodError } from "zod";
import { prisma } from "../utils/prisma";
import { sendSuccess, sendError } from "../utils/apiResponse";
import { uploadSchema, UploadInput } from "../validators/upload.validator";
import {
  CATEGORY_SIZE_LIMITS,
  MediaCategory,
} from "../middleware/upload.middleware";
import { startPipeline } from "../ai/pipeline";
import { PipelineContext } from "../ai/types";
import {
  uploadToCloudinary,
  deleteLocalFile,
} from "../utils/cloudinary";

async function removeSavedFile(file: Express.Multer.File | undefined): Promise<void> {
  if (!file?.path) return;
  await deleteLocalFile(file.path);
}

/**
 * Upload a local file to Cloudinary. Falls back to local path on failure.
 */
async function storeFile(
  localPath: string,
  category: MediaCategory,
  mimeType: string
): Promise<{ url: string; cloudinaryPublicId: string | null }> {
  const folder = `viranikosh/${category.toLowerCase()}`;

  try {
    const result = await uploadToCloudinary(localPath, folder, mimeType);
    // Clean up local file after successful upload
    await deleteLocalFile(localPath);
    return { url: result.url, cloudinaryPublicId: result.publicId };
  } catch (err) {
    // Log error but don't crash — fall back to local storage
    console.error(`Cloudinary upload failed, falling back to local:`, err);
    const fallbackUrl = `/files/${category.toLowerCase()}/${path.basename(localPath)}`;
    return { url: fallbackUrl, cloudinaryPublicId: null };
  }
}

/**
 * POST /api/uploads
 *
 * Auth required. Accepts a single multipart file (`file` field) plus a
 * `postId` field. Validates MIME type, extension, size and ownership,
 * uploads to Cloudinary (local fallback on failure), creates a Media
 * record + a QUEUED ProcessingJob, then triggers the AI pipeline asynchronously.
 */
export async function uploadMedia(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const parsed: UploadInput = uploadSchema.parse({
      postId: (req.body.postId || req.query.postId || "") as string,
    });
    const file = req.file;

    if (!file) {
      sendError(
        res,
        400,
        "No file uploaded. Expected a multipart field named 'file'."
      );
      return;
    }

    const post = await prisma.culturalPost.findUnique({
      where: { id: parsed.postId },
      select: { id: true, userId: true },
    });

    if (!post) {
      await removeSavedFile(file);
      sendError(res, 404, "Post not found.");
      return;
    }

    if (post.userId !== req.user!.id && req.user!.role !== "ADMIN") {
      await removeSavedFile(file);
      sendError(res, 403, "You can only upload media to your own posts.");
      return;
    }

    const category = (file as any).category as MediaCategory;
    const limit = CATEGORY_SIZE_LIMITS[category];

    if (file.size > limit) {
      await removeSavedFile(file);
      sendError(
        res,
        413,
        `File too large for ${category.toLowerCase()} uploads. Maximum size is ${Math.floor(limit / (1024 * 1024))}MB.`
      );
      return;
    }

    // Upload to Cloudinary (with local fallback)
    const { url, cloudinaryPublicId } = await storeFile(
      file.path,
      category,
      file.mimetype
    );

    const media = await prisma.media.create({
      data: {
        postId: parsed.postId,
        url,
        type: category,
        mimeType: file.mimetype,
        size: file.size,
        filename: file.originalname,
      },
    });

    const processingJob = await prisma.processingJob.create({
      data: { postId: parsed.postId, status: "QUEUED" },
    });

    // Trigger the AI pipeline asynchronously (fire-and-forget)
    const pipelineCtx: PipelineContext = {
      jobId: processingJob.id,
      postId: parsed.postId,
      mediaUrl: media.url,
      mediaType: category,
      mimeType: file.mimetype,
    };
    startPipeline(pipelineCtx);

    sendSuccess(res, 201, "Upload successful. File queued for processing.", {
      media: {
        ...media,
        cloudinaryPublicId,
      },
      processingJob,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      await removeSavedFile(req.file);
      sendError(res, 400, "Validation failed.", error.issues);
      return;
    }
    await removeSavedFile(req.file);
    next(error);
  }
}

/**
 * GET /api/uploads/:id/status
 *
 * Auth required (owner or admin). Returns the processing status of the
 * most recent ProcessingJob, along with any transcripts and translations
 * that have been generated.
 */
export async function getUploadStatus(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const mediaId = String(req.params.id);

    const media = await prisma.media.findUnique({
      where: { id: mediaId },
      select: {
        id: true,
        postId: true,
        post: { select: { userId: true } },
      },
    });

    if (!media) {
      sendError(res, 404, "Media not found.");
      return;
    }

    if (media.post.userId !== req.user!.id && req.user!.role !== "ADMIN") {
      sendError(res, 404, "Media not found.");
      return;
    }

    const processingJob = await prisma.processingJob.findFirst({
      where: { postId: media.postId },
      orderBy: { createdAt: "desc" },
    });

    // Fetch transcripts and translations (AI results stored separately)
    const transcripts = await prisma.transcript.findMany({
      where: { postId: media.postId },
      include: { language: { select: { code: true, name: true } } },
      orderBy: { createdAt: "desc" },
    });

    const translations = await prisma.translation.findMany({
      where: { postId: media.postId },
      include: { language: { select: { code: true, name: true } } },
      orderBy: { createdAt: "desc" },
    });

    // Fetch tags linked to this post
    const tagLinks = await prisma.tagOnPost.findMany({
      where: { postId: media.postId },
      include: { tag: { select: { name: true } } },
    });

    sendSuccess(res, 200, "Upload status fetched.", {
      mediaId: media.id,
      postId: media.postId,
      status: processingJob?.status ?? null,
      step: processingJob?.step ?? null,
      error: processingJob?.error ?? null,
      processingJob,
      transcripts,
      translations,
      tags: tagLinks.map((t) => t.tag.name),
    });
  } catch (error) {
    next(error);
  }
}
