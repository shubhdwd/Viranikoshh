import { Request, Response, NextFunction } from "express";
import { prisma } from "../utils/prisma";
import { sendSuccess } from "../utils/apiResponse";
import { POST_SELECT, formatPost } from "./post.controller";

/**
 * GET /api/search
 *
 * Public. Full-text search across published posts.
 * Query params:
 *   `q`        — search term (matches title, description, content)
 *   `tag`      — filter by tag name (case-insensitive partial match)
 *   `region`   — filter by region ID
 *   `category` — filter by category ID
 *   `page`     — page number (default 1)
 *   `limit`    — results per page (default 10, max 50)
 */
export async function searchPosts(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const q = (req.query.q as string || "").trim();
    const tag = (req.query.tag as string || "").trim();
    const region = (req.query.region as string || "").trim();
    const category = (req.query.category as string || "").trim();
    const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
    const limit = Math.min(
      50,
      Math.max(1, parseInt(req.query.limit as string, 10) || 10)
    );

    const where: any = { published: true };

    // Text search across title, description, content
    if (q) {
      where.OR = [
        { title: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
        { content: { contains: q, mode: "insensitive" } },
      ];
    }

    // Filter by tag (case-insensitive partial / contains match)
    if (tag) {
      where.tags = {
        some: {
          tag: { name: { contains: tag, mode: "insensitive" } },
        },
      };
    }

    // Filter by region
    if (region) {
      where.regionId = region;
    }

    // Filter by category
    if (category) {
      where.categoryId = category;
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

    sendSuccess(res, 200, "Search results fetched successfully.", {
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
 * GET /api/search/suggestions
 *
 * Public. Returns autocomplete suggestions based on a prefix.
 * Query params:
 *   `q` — prefix to match against (min 2 chars)
 *   `limit` — max suggestions (default 8, max 20)
 *
 * Returns a combined list of { type, value } objects:
 *   - type "title"    → post titles
 *   - type "tag"      → tag names
 *   - type "region"   → region names
 *   - type "category" → category names
 */
export async function searchSuggestions(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const q = (req.query.q as string || "").trim();
    const limit = Math.min(
      20,
      Math.max(1, parseInt(req.query.limit as string, 10) || 8)
    );

    if (q.length < 2) {
      sendSuccess(res, 200, "Suggestions fetched successfully.", []);
      return;
    }

    // Run all four searches in parallel
    const [titles, tags, regions, categories] = await Promise.all([
      prisma.culturalPost.findMany({
        where: {
          published: true,
          title: { contains: q, mode: "insensitive" },
        },
        select: { title: true },
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.tag.findMany({
        where: { name: { contains: q, mode: "insensitive" } },
        select: { name: true },
        take: limit,
      }),
      prisma.region.findMany({
        where: { name: { contains: q, mode: "insensitive" } },
        select: { name: true },
        take: limit,
      }),
      prisma.culturalCategory.findMany({
        where: { name: { contains: q, mode: "insensitive" } },
        select: { name: true },
        take: limit,
      }),
    ]);

    const suggestions = [
      ...titles.map((t) => ({ type: "title", value: t.title })),
      ...tags.map((t) => ({ type: "tag", value: t.name })),
      ...regions.map((r) => ({ type: "region", value: r.name })),
      ...categories.map((c) => ({ type: "category", value: c.name })),
    ];

    sendSuccess(res, 200, "Suggestions fetched successfully.", suggestions);
  } catch (error) {
    next(error);
  }
}
