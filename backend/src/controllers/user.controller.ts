import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { prisma } from "../utils/prisma";
import { sendSuccess, sendError } from "../utils/apiResponse";
import { updateUserSchema, UpdateUserInput } from "../validators/user.validator";
import { POST_SELECT, formatPost } from "./post.controller";

/**
 * GET /api/users/:id
 *
 * Public. Returns the user's profile info, counts (published posts,
 * followers, following), interests and their recent published posts.
 */
export async function getPublicProfile(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const id = String(req.params.id);

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        role: true,
        createdAt: true,
        profile: {
          select: { id: true, bio: true, avatar: true, location: true },
        },
        interests: {
          select: { category: { select: { id: true, name: true } } },
        },
        _count: {
          select: {
            posts: { where: { published: true } },
            followers: true,
            following: true,
          },
        },
      },
    });

    if (!user) {
      sendError(res, 404, "User not found.");
      return;
    }

    const recentPosts = await prisma.culturalPost.findMany({
      where: { userId: id, published: true },
      select: POST_SELECT,
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    sendSuccess(res, 200, "User profile fetched.", {
      user: {
        ...user,
        interests: user.interests.map((i) => i.category),
        counts: user._count,
      },
      recentPosts: recentPosts.map(formatPost),
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/users/me/interests
 *
 * Auth required. Returns the list of cultural categories the current user
 * follows as interests.
 */
export async function getMyInterests(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.id;

    const interests = await prisma.interest.findMany({
      where: { userId },
      select: {
        id: true,
        category: { select: { id: true, name: true, description: true } },
      },
      orderBy: { category: { name: "asc" } },
    });

    sendSuccess(res, 200, "Interests fetched successfully.", {
      interests: interests.map((i) => i.category),
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/users/me/following
 *
 * Auth required. Returns the list of user IDs the current user follows.
 */
export async function getMyFollowing(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.id;

    const follows = await prisma.follow.findMany({
      where: { followerId: userId },
      select: { followingId: true },
    });

    sendSuccess(res, 200, "Following fetched successfully.", {
      following: follows.map((f) => f.followingId),
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/users/me/saves
 *
 * Auth required. Returns the list of post IDs the current user has saved.
 */
export async function getMySaves(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.id;

    const saves = await prisma.save.findMany({
      where: { userId },
      select: { postId: true },
    });

    sendSuccess(res, 200, "Saves fetched successfully.", {
      saves: saves.map((s) => s.postId),
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/users/suggested
 *
 * Auth required. Returns 4-6 users the current user doesn't already follow,
 * sorted by published post count (most active first).
 */
export async function getSuggestedUsers(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.id;

    const following = await prisma.follow.findMany({
      where: { followerId: userId },
      select: { followingId: true },
    });
    const followingIds = following.map((f) => f.followingId);
    const excludeIds = [userId, ...followingIds];

    const users = await prisma.user.findMany({
      where: { id: { notIn: excludeIds } },
      select: {
        id: true,
        name: true,
        profile: { select: { avatar: true, bio: true } },
        _count: { select: { posts: { where: { published: true } } } },
      },
      orderBy: { posts: { _count: "desc" } },
      take: 6,
    });

    const shaped = users.map((u) => ({
      id: u.id,
      name: u.name,
      avatarUrl: u.profile?.avatar ?? null,
      bio: u.profile?.bio ?? null,
      postCount: u._count.posts,
    }));

    sendSuccess(res, 200, "Suggested users fetched.", shaped);
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /api/users/me
 *
 * Auth required. Updates the caller's own name and/or profile fields
 * (bio, avatar, location). Profile is upserted defensively.
 */
export async function updateMe(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const parsed: UpdateUserInput = updateUserSchema.parse(req.body);
    const userId = req.user!.id;

    const updated = await prisma.$transaction(
      async (tx) => {
        const user = await tx.user.update({
          where: { id: userId },
          data: { name: parsed.name },
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            createdAt: true,
            updatedAt: true,
          },
        });

        const profile = await tx.profile.upsert({
          where: { userId },
          update: {
            bio: parsed.bio,
            avatar: parsed.avatar,
            location: parsed.location,
          },
          create: {
            userId,
            bio: parsed.bio ?? undefined,
            avatar: parsed.avatar ?? undefined,
            location: parsed.location ?? undefined,
          },
        });

        return { user, profile };
      },
      { timeout: 30000 }
    );

    sendSuccess(res, 200, "Profile updated successfully.", {
      ...updated.user,
      profile: updated.profile,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      sendError(res, 400, "Validation failed.", error.issues);
      return;
    }
    next(error);
  }
}
