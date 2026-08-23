import { Request, Response, NextFunction } from "express";
import { prisma } from "../utils/prisma";
import { sendSuccess, sendError } from "../utils/apiResponse";

/**
 * POST /api/interests/:categoryId/follow
 *
 * Auth required. Follows a cultural category as an interest.
 * Idempotent — 201 on first follow, 200 if already following.
 */
export async function followInterest(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.id;
    const categoryId = String(req.params.categoryId);

    const category = await prisma.culturalCategory.findUnique({
      where: { id: categoryId },
      select: { id: true, name: true },
    });

    if (!category) {
      sendError(res, 404, "Category not found.");
      return;
    }

    try {
      const interest = await prisma.interest.create({
        data: { userId, categoryId },
        select: { id: true, userId: true, categoryId: true, category: { select: { id: true, name: true } } },
      });
      sendSuccess(res, 201, "Interest followed successfully.", interest);
    } catch (error) {
      if (
        error instanceof Error &&
        (error as any).code === "P2002"
      ) {
        sendSuccess(res, 200, "Already following this interest.", {
          categoryId,
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
 * DELETE /api/interests/:categoryId/follow
 *
 * Auth required. Unfollows a cultural category.
 * Idempotent — removes the interest if it exists.
 */
export async function unfollowInterest(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.id;
    const categoryId = String(req.params.categoryId);

    await prisma.interest.deleteMany({
      where: { userId, categoryId },
    });

    sendSuccess(res, 200, "Interest unfollowed successfully.", { categoryId });
  } catch (error) {
    next(error);
  }
}
