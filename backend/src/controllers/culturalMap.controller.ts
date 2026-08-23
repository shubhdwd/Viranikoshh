import { Request, Response, NextFunction } from "express";
import { prisma } from "../utils/prisma";
import { sendSuccess } from "../utils/apiResponse";

/**
 * GET /api/cultural-map
 *
 * Public. Returns all published posts that have location data (latitude + longitude)
 * for rendering on a cultural map.
 *
 * Returns: postId, title, latitude, longitude, region, category, thumbnail
 */
export async function getCulturalMap(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const posts = await prisma.culturalPost.findMany({
      where: {
        published: true,
        latitude: { not: null },
        longitude: { not: null },
      },
      select: {
        id: true,
        title: true,
        latitude: true,
        longitude: true,
        region: { select: { id: true, name: true, state: true, country: true } },
        category: { select: { id: true, name: true } },
        media: {
          select: { url: true, type: true, mimeType: true },
          take: 1,
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 500,
    });

    const markers = posts.map((post) => ({
      postId: post.id,
      title: post.title,
      latitude: post.latitude,
      longitude: post.longitude,
      region: post.region,
      category: post.category,
      thumbnail: post.media[0]?.url ?? null,
    }));

    sendSuccess(res, 200, "Cultural map data fetched successfully.", markers);
  } catch (error) {
    next(error);
  }
}
