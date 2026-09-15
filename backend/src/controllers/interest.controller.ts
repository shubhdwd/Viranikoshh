import { Request, Response, NextFunction } from "express";
import { prisma } from "../utils/prisma";
import { sendSuccess, sendError } from "../utils/apiResponse";

/**
 * Normalise a category reference for comparison. DB stores lowercase slug
 * names ("folk-song", "artwork") while the frontend sends slugs OR human
 * display names ("Folk Song", "Regional Artwork"). Lowercasing and replacing
 * spaces with hyphens makes the two interchangeable.
 */
function normalizeCategory(value: string): string {
  return value.toLowerCase().replace(/\s+/g, "-");
}

/**
 * Resolve a category by slug, display name, or DB ID.
 * The lookup is by normalized name so every spelling of a category resolves
 * to the same record regardless of how it is stored in the database.
 */
async function resolveCategory(raw: string): Promise<{ id: string; name: string } | null> {
  const compare = normalizeCategory(raw);
  const all = await prisma.culturalCategory.findMany({
    select: { id: true, name: true },
  });
  return all.find((c) => c.id === raw || normalizeCategory(c.name) === compare) ?? null;
}

/**
 * POST /api/interests/:categoryName/follow
 *
 * Auth required. Follows a cultural category as an interest.
 * Accepts a category slug (e.g. "folk-song") or display name (e.g. "Folk Song").
 * Idempotent — 201 on first follow, 200 if already following.
 */
export async function followInterest(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.id;
    const raw = String(req.params.categoryName);

    const category = await resolveCategory(raw);

    if (!category) {
      sendError(res, 404, "Category not found.");
      return;
    }

    try {
      const interest = await prisma.interest.create({
        data: { userId, categoryId: category.id },
        select: { id: true, userId: true, categoryId: true, category: { select: { id: true, name: true } } },
      });
      sendSuccess(res, 201, "Interest followed successfully.", interest);
    } catch (error) {
      if (
        error instanceof Error &&
        (error as any).code === "P2002"
      ) {
        sendSuccess(res, 200, "Already following this interest.", {
          categoryId: category.id,
          name: category.name,
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
 * DELETE /api/interests/:categoryName/follow
 *
 * Auth required. Unfollows a cultural category.
 * Accepts a category slug (name) instead of DB ID.
 * Idempotent — removes the interest if it exists.
 */
export async function unfollowInterest(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.id;
    const raw = String(req.params.categoryName);

    const category = await resolveCategory(raw);

    if (!category) {
      sendError(res, 404, "Category not found.");
      return;
    }

    await prisma.interest.deleteMany({
      where: { userId, categoryId: category.id },
    });

    sendSuccess(res, 200, "Interest unfollowed successfully.", {
      categoryName: category.name,
    });
  } catch (error) {
    next(error);
  }
}
