import { Request, Response, NextFunction } from "express";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";
import { prisma } from "../utils/prisma";
import { sendSuccess, sendError } from "../utils/apiResponse";
import {
  createPostSchema,
  updatePostSchema,
  relationSchema,
  CreatePostInput,
  RelationInput,
} from "../validators/post.validator";

/**
 * Shared select used by every read endpoint so posts always come back
 * with the author, media, tags, region, category and interaction counts.
 */
export const POST_SELECT = {
  id: true,
  title: true,
  description: true,
  content: true,
  latitude: true,
  longitude: true,
  published: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
  user: {
    select: {
      id: true,
      name: true,
      role: true,
      profile: { select: { id: true, bio: true, avatar: true, location: true } },
    },
  },
  region: { select: { id: true, name: true, state: true, country: true } },
  category: { select: { id: true, name: true, description: true } },
  media: { orderBy: { createdAt: "asc" as const }, take: 3 },
  tags: { include: { tag: true } },
  _count: { select: { likes: true, comments: true, saves: true } },
} satisfies Prisma.CulturalPostSelect;

type PostWithRelations = Prisma.CulturalPostGetPayload<{
  select: typeof POST_SELECT;
}>;

/**
 * Convert a Prisma post row (with the TagOnPost join shape) into the
 * public API shape — tags come back as a flat `{ id, name }` array.
 */
export function formatPost(post: PostWithRelations) {
  return {
    ...post,
    tags: post.tags.map((t) => ({ id: t.tag.id, name: t.tag.name })),
  };
}

async function ensureRegionExists(regionId: string): Promise<boolean> {
  const region = await prisma.region.findUnique({
    where: { id: regionId },
    select: { id: true },
  });
  return region !== null;
}

async function ensureCategoryExists(categoryId: string): Promise<boolean> {
  const category = await prisma.culturalCategory.findUnique({
    where: { id: categoryId },
    select: { id: true },
  });
  return category !== null;
}

/**
 * POST /api/posts
 *
 * Auth required. Validates input → checks region/category exist →
 * creates post with nested media + tags (upsert-by-name) → returns it.
 */
export async function createPost(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const parsed: CreatePostInput = createPostSchema.parse(req.body);
    const userId = req.user!.id;

    if (parsed.regionId && !(await ensureRegionExists(parsed.regionId))) {
      sendError(res, 400, "Region not found.");
      return;
    }
    if (parsed.categoryId && !(await ensureCategoryExists(parsed.categoryId))) {
      sendError(res, 400, "Category not found.");
      return;
    }

    const post = await prisma.culturalPost.create({
      data: {
        title: parsed.title,
        description: parsed.description,
        content: parsed.content,
        latitude: parsed.latitude,
        longitude: parsed.longitude,
        published: parsed.published ?? false,
        user: { connect: { id: userId } },
        region: parsed.regionId ? { connect: { id: parsed.regionId } } : undefined,
        category: parsed.categoryId ? { connect: { id: parsed.categoryId } } : undefined,
        media: parsed.media ? { create: parsed.media } : undefined,
        tags: parsed.tags
          ? {
              create: parsed.tags.map((name) => ({
                tag: { connectOrCreate: { where: { name }, create: { name } } },
              })),
            }
          : undefined,
      },
      select: POST_SELECT,
    });

    sendSuccess(res, 201, "Post created successfully.", formatPost(post));
  } catch (error) {
    if (error instanceof ZodError) {
      sendError(res, 400, "Validation failed.", error.issues);
      return;
    }
    next(error);
  }
}

/**
 * GET /api/posts/feed
 *
 * Public. Paginated feed of published posts, newest first.
 * Query params:
 *   `page`              — page number (default 1)
 *   `limit`             — results per page (default 10, max 50)
 *   `featured`          — if truthy, return top 6 posts sorted by like count
 *   `followedInterests` — comma-separated category names to filter by
 *   `followedCreators`  — comma-separated user IDs to filter by
 */
export async function getFeed(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
    const limit = Math.min(
      50,
      Math.max(1, parseInt(req.query.limit as string, 10) || 10)
    );
    const featured = Boolean(req.query.featured);

    // Parse comma-separated filter arrays
    const followedInterests = (req.query.followedInterests as string || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const followedCreators = (req.query.followedCreators as string || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const where: any = { published: true };

    // Filter by followed category interests (category names / slugs)
    if (followedInterests.length > 0) {
      where.category = {
        name: { in: followedInterests, mode: "insensitive" },
      };
    }

    // Filter by followed creator user IDs
    if (followedCreators.length > 0) {
      where.userId = { in: followedCreators };
    }

    // Featured mode: top 6 by like count
    if (featured) {
      const posts = await prisma.culturalPost.findMany({
        where,
        select: POST_SELECT,
        orderBy: { likes: { _count: "desc" } },
        take: 6,
      });
      sendSuccess(res, 200, "Featured feed fetched successfully.", {
        posts: posts.map(formatPost),
      });
      return;
    }

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

    sendSuccess(res, 200, "Feed fetched successfully.", {
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
 * GET /api/posts/:id
 *
 * Public for published posts. Unpublished (draft) posts are only visible
 * to their owner or an admin (returned as 404 to avoid leaking drafts).
 */
export async function getPostById(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const id = String(req.params.id);

    const post = await prisma.culturalPost.findUnique({
      where: { id },
      select: POST_SELECT,
    });

    if (!post) {
      sendError(res, 404, "Post not found.");
      return;
    }

    if (!post.published) {
      const viewer = req.user;
      const isOwner = viewer?.id === post.userId;
      const isAdmin = viewer?.role === "ADMIN";
      if (!isOwner && !isAdmin) {
        sendError(res, 404, "Post not found.");
        return;
      }
    }

    sendSuccess(res, 200, "Post fetched successfully.", formatPost(post));
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /api/posts/:id
 *
 * Auth required. Only the owner can edit. Replaces tags/media lists when
 * provided, updates scalar fields otherwise.
 */
export async function updatePost(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const parsed = updatePostSchema.parse(req.body);
    const id = String(req.params.id);
    const userId = req.user!.id;

    const post = await prisma.culturalPost.findUnique({
      where: { id },
      select: { id: true, userId: true },
    });

    if (!post) {
      sendError(res, 404, "Post not found.");
      return;
    }

    if (post.userId !== userId) {
      sendError(res, 403, "You can only edit your own posts.");
      return;
    }

    if (parsed.regionId && !(await ensureRegionExists(parsed.regionId))) {
      sendError(res, 400, "Region not found.");
      return;
    }
    if (parsed.categoryId && !(await ensureCategoryExists(parsed.categoryId))) {
      sendError(res, 400, "Category not found.");
      return;
    }

    const data: Prisma.CulturalPostUpdateInput = {
      title: parsed.title,
      description: parsed.description,
      content: parsed.content,
      latitude: parsed.latitude,
      longitude: parsed.longitude,
      published: parsed.published,
      region: parsed.regionId ? { connect: { id: parsed.regionId } } : undefined,
      category: parsed.categoryId ? { connect: { id: parsed.categoryId } } : undefined,
    };

    const updated = await prisma.$transaction(
      async (tx) => {
        if (parsed.tags !== undefined) {
          await tx.tagOnPost.deleteMany({ where: { postId: id } });
        }
        if (parsed.media !== undefined) {
          await tx.media.deleteMany({ where: { postId: id } });
        }
        return tx.culturalPost.update({
          where: { id },
          data: {
            ...data,
            tags: parsed.tags
              ? {
                  create: parsed.tags.map((name) => ({
                    tag: { connectOrCreate: { where: { name }, create: { name } } },
                  })),
                }
              : undefined,
            media: parsed.media ? { create: parsed.media } : undefined,
          },
          select: POST_SELECT,
        });
      },
      { timeout: 30000 }
    );

    sendSuccess(res, 200, "Post updated successfully.", formatPost(updated));
  } catch (error) {
    if (error instanceof ZodError) {
      sendError(res, 400, "Validation failed.", error.issues);
      return;
    }
    next(error);
  }
}

/**
 * DELETE /api/posts/:id
 *
 * Auth required. Only the owner or an admin can delete.
 */
export async function deletePost(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const id = String(req.params.id);
    const userId = req.user!.id;
    const role = req.user!.role;

    const post = await prisma.culturalPost.findUnique({
      where: { id },
      select: { id: true, userId: true },
    });

    if (!post) {
      sendError(res, 404, "Post not found.");
      return;
    }

    if (post.userId !== userId && role !== "ADMIN") {
      sendError(res, 403, "You can only delete your own posts.");
      return;
    }

    await prisma.culturalPost.delete({ where: { id } });

    sendSuccess(res, 200, "Post deleted successfully.");
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/posts/:id/related
 *
 * Public. Returns posts connected to this one via CulturalRelation,
 * with the relation type. Unpublished related posts are filtered out.
 */
export async function getRelatedPosts(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const id = String(req.params.id);

    const exists = await prisma.culturalPost.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!exists) {
      sendError(res, 404, "Post not found.");
      return;
    }

    const relations = await prisma.culturalRelation.findMany({
      where: { OR: [{ sourcePostId: id }, { targetPostId: id }] },
      include: {
        sourcePost: { select: POST_SELECT },
        targetPost: { select: POST_SELECT },
      },
      orderBy: { createdAt: "desc" },
    });

    const related = relations
      .map((rel) => {
        const other = rel.sourcePostId === id ? rel.targetPost : rel.sourcePost;
        return { relationType: rel.relationType, post: formatPost(other) };
      })
      .filter((item) => item.post.published);

    sendSuccess(res, 200, "Related posts fetched successfully.", { related });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/posts/:id/relations
 *
 * Auth required. Creates a cultural relation between the source post (from
 * :id) and a target post. Only the owner of the source post can create
 * relations. Idempotent — upserts on (sourcePostId, targetPostId, relationType).
 */
export async function createRelation(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const parsed: RelationInput = relationSchema.parse(req.body);
    const sourcePostId = String(req.params.id);
    const userId = req.user!.id;

    const sourcePost = await prisma.culturalPost.findUnique({
      where: { id: sourcePostId },
      select: { id: true, userId: true },
    });

    if (!sourcePost) {
      sendError(res, 404, "Source post not found.");
      return;
    }

    if (sourcePost.userId !== userId) {
      sendError(res, 403, "You can only create relations for your own posts.");
      return;
    }

    if (parsed.targetPostId === sourcePostId) {
      sendError(res, 400, "A post cannot be related to itself.");
      return;
    }

    const targetPost = await prisma.culturalPost.findUnique({
      where: { id: parsed.targetPostId },
      select: { id: true },
    });

    if (!targetPost) {
      sendError(res, 404, "Target post not found.");
      return;
    }

    const relation = await prisma.culturalRelation.upsert({
      where: {
        sourcePostId_targetPostId_relationType: {
          sourcePostId,
          targetPostId: parsed.targetPostId,
          relationType: parsed.relationType,
        },
      },
      create: {
        sourcePostId,
        targetPostId: parsed.targetPostId,
        relationType: parsed.relationType,
      },
      update: {},
      select: {
        id: true,
        relationType: true,
        sourcePostId: true,
        targetPostId: true,
        sourcePost: { select: POST_SELECT },
        targetPost: { select: POST_SELECT },
      },
    });

    sendSuccess(res, 201, "Relation created successfully.", {
      relationType: relation.relationType,
      sourcePost: formatPost(relation.sourcePost),
      targetPost: formatPost(relation.targetPost),
    });
  } catch (error) {
    if (error instanceof ZodError) {
      sendError(res, 400, "Validation failed.", error.issues);
      return;
    }
    next(error);
  }
}
