import { Request, Response, NextFunction } from "express";
import { prisma } from "../utils/prisma";
import { sendSuccess } from "../utils/apiResponse";

/**
 * GET /api/taxonomy
 *
 * Public. Returns regions and cultural categories with their database IDs
 * so the frontend Create form can send regionId / categoryId.
 */
export async function getTaxonomy(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const [regions, categories] = await Promise.all([
      prisma.region.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
      prisma.culturalCategory.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    ]);
    sendSuccess(res, 200, "Taxonomy fetched.", { regions, categories });
  } catch (error) {
    next(error);
  }
}
