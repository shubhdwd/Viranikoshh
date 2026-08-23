import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { prisma } from "../utils/prisma";
import { sendSuccess, sendError } from "../utils/apiResponse";
import { POST_SELECT, formatPost } from "./post.controller";
import {
  verifyPostSchema,
  correctionSchema,
  VerifyPostInput,
  CorrectionInput,
} from "../validators/verification.validator";

/**
 * Shared select for returning a verification with the submitting user's info.
 */
const VERIFICATION_SELECT = {
  id: true,
  status: true,
  comment: true,
  userId: true,
  postId: true,
  createdAt: true,
  updatedAt: true,
  user: {
    select: { id: true, name: true, email: true },
  },
} satisfies any;

/**
 * Shared select for returning a correction with the submitting user's info.
 */
const CORRECTION_SELECT = {
  id: true,
  field: true,
  suggestion: true,
  userId: true,
  postId: true,
  createdAt: true,
  user: {
    select: { id: true, name: true, email: true },
  },
} satisfies any;

/**
 * POST /api/posts/:id/verify
 *
 * Auth required. A community member verifies or flags a post.
 * Users cannot verify their own posts (community-driven rule).
 */
export async function verifyPost(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const parsed: VerifyPostInput = verifyPostSchema.parse(req.body);
    const postId = String(req.params.id);
    const userId = req.user!.id;

    const post = await prisma.culturalPost.findUnique({
      where: { id: postId },
      select: { id: true, userId: true },
    });

    if (!post) {
      sendError(res, 404, "Post not found.");
      return;
    }

    if (post.userId === userId) {
      sendError(res, 400, "You cannot verify your own post.");
      return;
    }

    const verification = await prisma.verification.upsert({
      where: {
        postId_userId: { postId, userId },
      },
      create: {
        status: parsed.status,
        comment: parsed.comment,
        userId,
        postId,
      },
      update: {
        status: parsed.status,
        comment: parsed.comment,
      },
      select: VERIFICATION_SELECT,
    });

    try {
      const actor = await prisma.user.findUnique({
        where: { id: userId },
        select: { name: true },
      });
      await prisma.notification.create({
        data: {
          type: "VERIFICATION",
          message: `${actor?.name ?? "Someone"} verified your post as ${parsed.status}.`,
          relatedId: postId,
          userId: post.userId,
          actorId: userId,
        },
      });
    } catch { /* notification failure should not block the verification */ }

    sendSuccess(res, 201, "Verification submitted successfully.", verification);
  } catch (error) {
    if (error instanceof ZodError) {
      sendError(res, 400, "Validation failed.", error.issues);
      return;
    }
    next(error);
  }
}

/**
 * POST /api/posts/:id/corrections
 *
 * Auth required. A user suggests a correction to a post's content.
 * Users can correct their own posts too (self-correction is valid).
 */
export async function suggestCorrection(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const parsed: CorrectionInput = correctionSchema.parse(req.body);
    const postId = String(req.params.id);
    const userId = req.user!.id;

    const post = await prisma.culturalPost.findUnique({
      where: { id: postId },
      select: { id: true, userId: true },
    });

    if (!post) {
      sendError(res, 404, "Post not found.");
      return;
    }

    const correction = await prisma.correction.create({
      data: {
        field: parsed.field,
        suggestion: parsed.suggestion,
        userId,
        postId,
      },
      select: CORRECTION_SELECT,
    });

    try {
      const actor = await prisma.user.findUnique({
        where: { id: userId },
        select: { name: true },
      });
      await prisma.notification.create({
        data: {
          type: "CORRECTION",
          message: `${actor?.name ?? "Someone"} suggested a correction on your post.`,
          relatedId: postId,
          userId: post.userId,
          actorId: userId,
        },
      });
    } catch { /* notification failure should not block the correction */ }

    sendSuccess(res, 201, "Correction submitted successfully.", correction);
  } catch (error) {
    if (error instanceof ZodError) {
      sendError(res, 400, "Validation failed.", error.issues);
      return;
    }
    next(error);
  }
}

/**
 * GET /api/verification/queue
 *
 * Auth required. Returns published posts that have fewer than 3 verifications
 * and have not already been verified by the current user. Paginated.
 */
export async function getVerificationQueue(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.id;
    const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string, 10) || 10));

    // Get all published post IDs
    const publishedPosts = await prisma.culturalPost.findMany({
      where: { published: true },
      select: { id: true },
    });

    // Get verification counts grouped by postId
    const verificationGroups = await prisma.verification.groupBy({
      by: ["postId"],
      _count: { id: true },
    });

    const countMap = new Map(verificationGroups.map((g) => [g.postId, g._count.id]));

    // Filter posts with fewer than 3 verifications
    const eligibleIds = publishedPosts
      .filter((p) => (countMap.get(p.id) || 0) < 3)
      .map((p) => p.id);

    // Exclude posts the current user already verified
    const myVerifications = await prisma.verification.findMany({
      where: { userId, postId: { in: eligibleIds } },
      select: { postId: true },
    });

    const myVerifiedIds = new Set(myVerifications.map((v) => v.postId));
    const availableIds = eligibleIds.filter((id) => !myVerifiedIds.has(id));

    // Paginate IDs
    const total = availableIds.length;
    const totalPages = Math.ceil(total / limit);
    const start = (page - 1) * limit;
    const paginatedIds = availableIds.slice(start, start + limit);

    // Fetch full post data
    const posts = await prisma.culturalPost.findMany({
      where: { id: { in: paginatedIds } },
      select: POST_SELECT,
      orderBy: { createdAt: "desc" },
    });

    sendSuccess(res, 200, "Verification queue fetched successfully.", {
      posts: posts.map(formatPost),
      pagination: { page, limit, total, totalPages },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/verification/flagged
 *
 * Auth required. Returns published posts that have at least one correction
 * submitted. Paginated.
 */
export async function getFlaggedPosts(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string, 10) || 10));

    const where = { published: true, corrections: { some: {} } };

    const [posts, total] = await Promise.all([
      prisma.culturalPost.findMany({
        where,
        select: POST_SELECT,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.culturalPost.count({ where }),
    ]);

    sendSuccess(res, 200, "Flagged posts fetched successfully.", {
      posts: posts.map(formatPost),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/posts/:id/verifications
 *
 * Auth required. Returns all verifications and corrections for a post,
 * ordered by most recent first.
 */
export async function getVerifications(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const postId = String(req.params.id);

    const post = await prisma.culturalPost.findUnique({
      where: { id: postId },
      select: { id: true },
    });

    if (!post) {
      sendError(res, 404, "Post not found.");
      return;
    }

    const [verifications, corrections] = await Promise.all([
      prisma.verification.findMany({
        where: { postId },
        select: VERIFICATION_SELECT,
        orderBy: { createdAt: "desc" },
      }),
      prisma.correction.findMany({
        where: { postId },
        select: CORRECTION_SELECT,
        orderBy: { createdAt: "desc" },
      }),
    ]);

    sendSuccess(res, 200, "Verifications fetched successfully.", {
      verifications,
      corrections,
    });
  } catch (error) {
    next(error);
  }
}
