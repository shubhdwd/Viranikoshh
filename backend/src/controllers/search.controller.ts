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
 * Read a single query param value into a clean string array.
 * Handles:
 *   string                     → [value]
 *   array (repeat keys)        → [a, b]     (frontend paramsSerializer)
 *   object (bracket-style key) → [a, b]     (Express "simple" parser)
 */
function pickValue(req: Request, key: string): string[] {
  const raw = (req.query as Record<string, unknown>)[key];
  if (raw === undefined || raw === null) return [];
  if (typeof raw === "string") return raw.trim() ? [raw.trim()] : [];
  if (Array.isArray(raw)) return raw.map(String).filter(Boolean);
  if (typeof raw === "object") {
    return Object.values(raw as Record<string, unknown>)
      .flatMap((v) => (Array.isArray(v) ? v : [v]))
      .filter((v) => typeof v === "string" && v.trim().length > 0)
      .map((v) => String(v).trim());
  }
  return String(raw).trim() ? [String(raw).trim()] : [];
}

/**
 * Read a repeatable query param, supporting BOTH formats the frontend /
 * Express may produce:
 *   ?key=a&key=b      → req.query.key = ["a", "b"]   (paramsSerializer)
 *   ?key[]=a&key[]=b  → req.query["key[]"] = { "": ["a","b"] } (legacy brackets)
 * Returns a clean string array (or []).
 */
function pickArray(req: Request, key: string): string[] {
  return [...pickValue(req, key), ...pickValue(req, `${key}[]`)];
}

/**
 * Split a facet label into lowercase search tokens.
 * "Warli painting" → ["warli", "painting"].
 */
function tokens(value: string): string[] {
  return value.toLowerCase().match(/[a-z0-9]{3,}/g) ?? [];
}

/**
 * Build OR-clauses that match posts whose tags contain any of the given
 * facet tokens. One clause per unique token; caller ORs them together.
 */
function tagClauses(values: string[]): Array<{
  tags: { some: { tag: { name: { contains: string; mode: "insensitive" } } } };
}> {
  const seen = new Set<string>();
  for (const value of values) {
    for (const token of tokens(value)) seen.add(token);
  }
  return Array.from(seen).map((token) => ({
    tags: {
      some: {
        tag: { name: { contains: token, mode: "insensitive" } },
      },
    },
  }));
}

/**
 * GET /api/search
 *
 * Public. Full-text search across published posts.
 * Query params:
 *   `q`              — search term (matches title, description, content)
 *   `tag` / `tags`   — filter by tag name(s)
 *   `region` / `regions` — filter by region name(s) or ID(s)
 *   `category` / `categories` — filter by category slug(s), name(s), or ID(s)
 *   `languages`      — filter by source language(s) (tag or transcript match)
 *   `traditions`     — filter by tradition label(s) (tag match)
 *   `artForms`       — filter by art-form label(s) (tag match)
 *   `festivals`      — filter by festival name(s) (tag match)
 *   `mediaTypes`     — filter by media type(s) (image/video/audio/text)
 *   `verification`   — filter by community status
 *                      (verified | flagged | correction-suggested | pending)
 *   `page`           — page number (default 1)
 *   `limit`          — results per page (default 10, max 50)
 *
 * Facet semantics: values within one facet are OR'd; facets are AND'd
 * together (including the free-text `q`). Categories and regions are
 * relational filters applied at the top level of the where clause.
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
    const categoryValues = [
      ...pickArray(req, "category"),
      ...pickArray(req, "categories"),
    ];
    const regionValues = [
      ...pickArray(req, "region"),
      ...pickArray(req, "regions"),
    ];
    const tagValues = [
      ...pickArray(req, "tag"),
      ...pickArray(req, "tags"),
    ];
    const languageValues = [...pickArray(req, "languages"), ...pickArray(req, "language")];
    const traditionValues = [...pickArray(req, "traditions"), ...pickArray(req, "tradition")];
    const artFormValues = [...pickArray(req, "artForms"), ...pickArray(req, "artForm")];
    const festivalValues = [...pickArray(req, "festivals"), ...pickArray(req, "festival")];
    const mediaTypeValues = [...pickArray(req, "mediaTypes"), ...pickArray(req, "mediaType")];
    const verificationValues = [...pickArray(req, "verification"), ...pickArray(req, "verifications")];

    const where: any = { published: true };
    const and: any[] = [];

    // Text search across title, description, content
    if (q) {
      const escaped = escapeLike(q);
      and.push({
        OR: [
          { title: { contains: escaped, mode: "insensitive" } },
          { description: { contains: escaped, mode: "insensitive" } },
          { content: { contains: escaped, mode: "insensitive" } },
        ],
      });
    }

    // Filter by tag(s) — case-insensitive partial match
    if (tagValues.length > 0) {
      and.push({
        OR: tagClauses(tagValues),
      });
    }

    // Tag-based quick-browse facets — OR within the facet, AND across facets
    const tagFacets: Array<[string[], string]> = [
      [traditionValues, "tradition"],
      [artFormValues, "art form"],
      [festivalValues, "festival"],
    ];
    for (const [values, label] of tagFacets) {
      if (values.length > 0) {
        const clauses = tagClauses(values);
        if (clauses.length > 0) {
          and.push({ OR: clauses });
        } else {
          console.warn(`[search] '${label}' filter had no searchable tokens; ignored.`);
        }
      }
    }

    // Languages — match by tag token OR transcript source language
    if (languageValues.length > 0) {
      and.push({
        OR: [
          ...tagClauses(languageValues),
          {
            transcripts: {
              some: {
                language: {
                  name: { in: languageValues, mode: "insensitive" },
                },
              },
            },
          },
        ],
      });
    }

    // Media types — match against media.type case-insensitively
    if (mediaTypeValues.length > 0) {
      and.push({
        OR: mediaTypeValues.map((m) => ({
          media: { some: { type: { equals: m, mode: "insensitive" } } },
        })),
      });
    }

    // Verification status — derived from community rows
    if (verificationValues.length > 0) {
      const statusClauses: any[] = [];
      for (const value of verificationValues) {
        const v = value.toLowerCase();
        if (v === "verified") {
          statusClauses.push({
            verifications: {
              some: { status: { equals: "VERIFIED", mode: "insensitive" } },
            },
          });
        } else if (v === "flagged") {
          statusClauses.push({
            verifications: {
              some: { status: { equals: "FLAGGED", mode: "insensitive" } },
            },
          });
        } else if (v === "correction-suggested" || v === "correction") {
          statusClauses.push({ corrections: { some: {} } });
        } else if (v === "pending") {
          // No verification or correction of any kind yet
          statusClauses.push({
            NOT: [{ verifications: { some: {} } }, { corrections: { some: {} } }],
          });
        }
      }
      if (statusClauses.length > 0) {
        and.push({ OR: statusClauses });
      }
    }

    if (and.length > 0) {
      where.AND = and;
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

    // Filter by category — match by slug, display name, or ID.
    // Both sides are normalized to "lowercase-hyphenated" so "Folk Song"
    // and "folk-song" resolve to the same categories (same approach as getFeed).
    if (categoryValues.length > 0) {
      const normalize = (s: string) => s.toLowerCase().replace(/\s+/g, "-");
      const normalizedFilters = [...new Set(categoryValues.map(normalize))];
      const allCategories = await prisma.culturalCategory.findMany({
        select: { id: true, name: true },
      });
      const matchingIds = allCategories
        .filter(
          (c) =>
            categoryValues.includes(c.id) ||
            normalizedFilters.includes(normalize(c.name))
        )
        .map((c) => c.id);
      // `in: []` returns zero rows — a clean "no match" that avoids the
      // old `categoryId = "__NONE__"` hack.
      where.categoryId = { in: matchingIds };
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