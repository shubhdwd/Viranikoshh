import { Request, Response, NextFunction } from "express";
import { prisma } from "../utils/prisma";
import { sendSuccess } from "../utils/apiResponse";
import { POST_SELECT, formatPost } from "./post.controller";

/**
 * Escape special characters used in SQL LIKE patterns to prevent
 * users from crafting broader searches via %, _, or \ wildcards.
 */
function escapeLike(value: string): string {
  return value.replace(/[%_\\]/g, "\\$&");
}

/**
 * Normalise a query-string value into a clean string array.
 * Axios may send: ?categories=foo  → string, or ?categories[]=foo → string[],
 * or ?categories=foo&categories=bar → string[].
 */
function toArray(val: unknown): string[] {
  if (!val) return [];
  if (Array.isArray(val)) return val.map(String).filter(Boolean);
  return [String(val)].filter(Boolean);
}

/**
 * Frontend category slugs (CulturalCategory keys) → DB category names.
 */
const SLUG_TO_NAME: Record<string, string> = {
  "folk-story": "folk-story",
  "folk-song": "folk-song",
  "oral-tradition": "oral-tradition",
  artwork: "artwork",
  craft: "craft",
  festival: "festival",
  "local-history": "local-history",
  "traditional-practice": "traditional-practice",
};

/**
 * GET /api/search
 *
 * Public. Full-text search across published posts.
 * Query params:
 *   `q`           — search term (matches title, description, content)
 *   `tag` / `tags`— filter by tag name(s)
 *   `region` / `regions` — filter by region name(s) or ID(s)
 *   `category` / `categories` — filter by category slug(s) or ID(s)
 *   `languages`   — filter by source language(s)
 *   `verification`— filter by community verification status
 *   `page`        — page number (default 1)
 *   `limit`       — results per page (default 10, max 50)
 */
export async function searchPosts(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const q = (req.query.q as string || "").trim();
    const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
    const limit = Math.min(
      50,
      Math.max(1, parseInt(req.query.limit as string, 10) || 10)
    );

    // Accept both singular and plural param names (frontend sends plural)
    const categorySlugs = [
      ...toArray(req.query.category),
      ...toArray(req.query.categories),
    ];
    const regionValues = [
      ...toArray(req.query.region),
      ...toArray(req.query.regions),
    ];
    const tagValues = [
      ...toArray(req.query.tag),
      ...toArray(req.query.tags),
    ];
    // language/verification filters reserved for future use

    const where: any = { published: true };

    // Text search across title, description, content
    if (q) {
      const escaped = escapeLike(q);
      where.OR = [
        { title: { contains: escaped, mode: "insensitive" } },
        { description: { contains: escaped, mode: "insensitive" } },
        { content: { contains: escaped, mode: "insensitive" } },
      ];
    }

    // Filter by tag(s) — case-insensitive partial match
    if (tagValues.length > 0) {
      where.tags = {
        some: {
          tag: {
            name: { in: tagValues.map((t) => t), mode: "insensitive" },
          },
        },
      };
    }

    // Filter by region(s) — match by ID or by name (case-insensitive)
    if (regionValues.length > 0) {
      where.region = {
        OR: [
          { id: { in: regionValues } },
          { name: { in: regionValues, mode: "insensitive" } },
        ],
      };
    }

    // Filter by category slug(s) — resolve to DB category IDs
    if (categorySlugs.length > 0) {
      // Resolve slugs to display names, then look up in DB
      const categoryNames = categorySlugs
        .map((s) => SLUG_TO_NAME[s] ?? s) // slug → name, or pass through if already a name/ID
        .filter(Boolean);

      // Look up categories by name (case-insensitive) OR by ID
      const matchingCategories = await prisma.culturalCategory.findMany({
        where: {
          OR: [
            { name: { in: categoryNames, mode: "insensitive" } },
            { id: { in: categorySlugs } },
          ],
        },
        select: { id: true },
      });

      if (matchingCategories.length > 0) {
        where.categoryId = {
          in: matchingCategories.map((c) => c.id),
        };
      } else {
        // No matching categories found — return empty result
        where.categoryId = "__NONE__";
      }
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

    const escaped = escapeLike(q);

    // Run all four searches in parallel
    const [titles, tags, regions, categories] = await Promise.all([
      prisma.culturalPost.findMany({
        where: {
          published: true,
          title: { contains: escaped, mode: "insensitive" },
        },
        select: { title: true },
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.tag.findMany({
        where: { name: { contains: escaped, mode: "insensitive" } },
        select: { name: true },
        take: limit,
      }),
      prisma.region.findMany({
        where: { name: { contains: escaped, mode: "insensitive" } },
        select: { name: true },
        take: limit,
      }),
      prisma.culturalCategory.findMany({
        where: { name: { contains: escaped, mode: "insensitive" } },
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
