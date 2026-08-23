import { Request, Response, NextFunction } from "express";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";
import { prisma } from "../utils/prisma";
import { sendSuccess, sendError } from "../utils/apiResponse";
import {
  createCommentSchema,
  CreateCommentInput,
} from "../validators/social.validator";

const COMMENT_USER_SELECT = {
  select: {
    id: true,
    name: true,
    profile: { select: { avatar: true } },
  },
};

const COMMENT_SELECT = {
  id: true,
  content: true,
  parentId: true,
  createdAt: true,
  updatedAt: true,
  user: COMMENT_USER_SELECT,
  replies: {
    select: {
      id: true,
      content: true,
      parentId: true,
      createdAt: true,
      updatedAt: true,
      user: COMMENT_USER_SELECT,
    },
    orderBy: { createdAt: "asc" as const },
  },
};

/**
 * POST /api/posts/:id/like
 *
 * Auth required. Idempotent — 201 on first like, 200 if already liked.
 */
export async function likePost(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.id;
    const postId = String(req.params.id);

    const post = await prisma.culturalPost.findUnique({
      where: { id: postId },
      select: { id: true, userId: true },
    });
    if (!post) {
      sendError(res, 404, "Post not found.");
      return;
    }

    try {
      const like = await prisma.like.create({ data: { userId, postId } });

      if (post.userId !== userId) {
        try {
          const actor = await prisma.user.findUnique({
            where: { id: userId },
            select: { name: true },
          });
          await prisma.notification.create({
            data: {
              type: "LIKE",
              message: `${actor?.name ?? "Someone"} liked your post.`,
              relatedId: postId,
              userId: post.userId,
              actorId: userId,
            },
          });
        } catch { /* notification failure should not block the like */ }
      }

      sendSuccess(res, 201, "Post liked successfully.", like);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        sendSuccess(res, 200, "Post already liked.", { postId, userId });
        return;
      }
      throw error;
    }
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/posts/:id/like
 *
 * Auth required. Idempotent — removes the like if it exists.
 */
export async function unlikePost(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.id;
    const postId = String(req.params.id);

    const post = await prisma.culturalPost.findUnique({
      where: { id: postId },
      select: { id: true },
    });
    if (!post) {
      sendError(res, 404, "Post not found.");
      return;
    }

    await prisma.like.deleteMany({ where: { userId, postId } });
    sendSuccess(res, 200, "Post unliked successfully.", { postId });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/posts/:id/save
 *
 * Auth required. Idempotent — 201 on first save, 200 if already saved.
 */
export async function savePost(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.id;
    const postId = String(req.params.id);

    const post = await prisma.culturalPost.findUnique({
      where: { id: postId },
      select: { id: true },
    });
    if (!post) {
      sendError(res, 404, "Post not found.");
      return;
    }

    try {
      const save = await prisma.save.create({ data: { userId, postId } });
      sendSuccess(res, 201, "Post saved successfully.", save);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        sendSuccess(res, 200, "Post already saved.", { postId, userId });
        return;
      }
      throw error;
    }
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/posts/:id/save
 *
 * Auth required. Idempotent — removes the save if it exists.
 */
export async function unsavePost(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.id;
    const postId = String(req.params.id);

    const post = await prisma.culturalPost.findUnique({
      where: { id: postId },
      select: { id: true },
    });
    if (!post) {
      sendError(res, 404, "Post not found.");
      return;
    }

    await prisma.save.deleteMany({ where: { userId, postId } });
    sendSuccess(res, 200, "Post unsaved successfully.", { postId });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/posts/:id/comments
 *
 * Public. Returns top-level comments with their replies, newest structure
 * kept flat (top-level ordered by createdAt asc, replies nested under it).
 */
export async function getComments(
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

    const comments = await prisma.comment.findMany({
      where: { postId, parentId: null },
      select: {
        ...COMMENT_SELECT,
        _count: { select: { replies: true } },
      },
      orderBy: { createdAt: "asc" },
      take: 50,
    });

    sendSuccess(res, 200, "Comments fetched successfully.", {
      count: comments.length,
      comments,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/posts/:id/comments
 *
 * Auth required. Creates a comment (or a reply via optional parentId).
 * The parent must exist and belong to the same post.
 */
export async function addComment(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const parsed: CreateCommentInput = createCommentSchema.parse(req.body);
    const userId = req.user!.id;
    const postId = String(req.params.id);

    const post = await prisma.culturalPost.findUnique({
      where: { id: postId },
      select: { id: true, userId: true },
    });
    if (!post) {
      sendError(res, 404, "Post not found.");
      return;
    }

    if (parsed.parentId) {
      const parent = await prisma.comment.findUnique({
        where: { id: parsed.parentId },
        select: { id: true, postId: true },
      });
      if (!parent) {
        sendError(res, 400, "Parent comment not found.");
        return;
      }
      if (parent.postId !== postId) {
        sendError(res, 400, "Parent comment does not belong to this post.");
        return;
      }
    }

    const comment = await prisma.comment.create({
      data: {
        content: parsed.content,
        userId,
        postId,
        parentId: parsed.parentId,
      },
      select: {
        id: true,
        content: true,
        parentId: true,
        createdAt: true,
        updatedAt: true,
        user: COMMENT_USER_SELECT,
      },
    });

    if (post.userId !== userId) {
      try {
        const actor = await prisma.user.findUnique({
          where: { id: userId },
          select: { name: true },
        });
        await prisma.notification.create({
          data: {
            type: "COMMENT",
            message: `${actor?.name ?? "Someone"} commented on your post.`,
            relatedId: postId,
            userId: post.userId,
            actorId: userId,
          },
        });
      } catch { /* notification failure should not block the comment */ }
    }

    sendSuccess(res, 201, "Comment added successfully.", comment);
  } catch (error) {
    if (error instanceof ZodError) {
      sendError(res, 400, "Validation failed.", error.issues);
      return;
    }
    next(error);
  }
}

/**
 * POST /api/users/:id/follow
 *
 * Auth required. Idempotent — 201 on first follow, 200 if already following.
 */
export async function followUser(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const followerId = req.user!.id;
    const followingId = String(req.params.id);

    if (followerId === followingId) {
      sendError(res, 400, "You cannot follow yourself.");
      return;
    }

    const target = await prisma.user.findUnique({
      where: { id: followingId },
      select: { id: true },
    });
    if (!target) {
      sendError(res, 404, "User not found.");
      return;
    }

    try {
      const follow = await prisma.follow.create({
        data: { followerId, followingId },
      });

      try {
        const actor = await prisma.user.findUnique({
          where: { id: followerId },
          select: { name: true },
        });
        await prisma.notification.create({
          data: {
            type: "FOLLOW",
            message: `${actor?.name ?? "Someone"} started following you.`,
            relatedId: followerId,
            userId: followingId,
            actorId: followerId,
          },
        });
      } catch { /* notification failure should not block the follow */ }

      sendSuccess(res, 201, "User followed successfully.", follow);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        sendSuccess(res, 200, "Already following this user.", {
          followingId,
        });
        return;
      }
      throw error;
    }
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/users/:id/follow
 *
 * Auth required. Idempotent — removes the follow if it exists.
 */
export async function unfollowUser(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const followerId = req.user!.id;
    const followingId = String(req.params.id);

    await prisma.follow.deleteMany({ where: { followerId, followingId } });
    sendSuccess(res, 200, "User unfollowed successfully.", { followingId });
  } catch (error) {
    next(error);
  }
}
