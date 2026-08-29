import { Request, Response, NextFunction } from "express";
import { prisma } from "../utils/prisma";
import { sendSuccess, sendError } from "../utils/apiResponse";

/**
 * Convert a frontend category slug (e.g. "folk-song") to a DB display name
 * (e.g. "Folk Song"). If the input is already a display name, returns it as-is.
 */
function slugToCategoryName(slug: string): string {
  const SLUG_TO_NAME: Record<string, string> = {
    "folk-story": "Folk Story",
    "folk-song": "Folk Song",
    "oral-tradition": "Oral Tradition",
    artwork: "Regional Artwork",
    craft: "Craft",
    festival: "Festival",
    "local-history": "Local History",
    "traditional-practice": "Traditional Practice",
  };
  return SLUG_TO_NAME[slug] ?? slug;
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
    const categoryName = slugToCategoryName(raw);

    const category = await prisma.culturalCategory.findFirst({
      where: { name: categoryName },
      select: { id: true, name: true },
    });

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
    const categoryName = slugToCategoryName(raw);

    const category = await prisma.culturalCategory.findFirst({
      where: { name: categoryName },
      select: { id: true },
    });

    if (!category) {
      sendError(res, 404, "Category not found.");
      return;
    }

    await prisma.interest.deleteMany({
      where: { userId, categoryId: category.id },
    });

    sendSuccess(res, 200, "Interest unfollowed successfully.", { categoryName });
  } catch (error) {
    next(error);
  }
}
