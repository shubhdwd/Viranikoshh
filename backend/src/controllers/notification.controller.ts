import { Request, Response, NextFunction } from "express";
import { prisma } from "../utils/prisma";
import { sendSuccess, sendError } from "../utils/apiResponse";

/**
 * GET /api/notifications
 *
 * Auth required. Returns paginated notifications for the authenticated user,
 * most recent first.
 * Query params: `page` (default 1), `limit` (default 10, max 50).
 */
export async function getNotifications(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.id;
    const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
    const limit = Math.min(
      50,
      Math.max(1, parseInt(req.query.limit as string, 10) || 10)
    );

    const where = { userId };

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          type: true,
          message: true,
          read: true,
          relatedId: true,
          userId: true,
          actorId: true,
          createdAt: true,
          actor: {
            select: {
              id: true,
              name: true,
              profile: { select: { avatar: true } },
            },
          },
        },
      }),
      prisma.notification.count({ where }),
    ]);

    const shaped = notifications.map((n) => ({
      ...n,
      actor: n.actor
        ? { id: n.actor.id, name: n.actor.name, avatarUrl: n.actor.profile?.avatar ?? null }
        : null,
    }));

    sendSuccess(res, 200, "Notifications fetched successfully.", {
      notifications: shaped,
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
 * PATCH /api/notifications/read-all
 *
 * Auth required. Marks all unread notifications for the authenticated user
 * as read. Returns the count of updated notifications.
 */
export async function markAllNotificationsRead(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.id;

    const result = await prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    });

    sendSuccess(res, 200, "All notifications marked as read.", {
      updatedCount: result.count,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /api/notifications/:id/read
 *
 * Auth required. Marks a single notification as read.
 * Ownership check — user can only mark their own notifications.
 */
export async function markNotificationRead(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.id;
    const id = String(req.params.id);

    const notification = await prisma.notification.findUnique({
      where: { id },
      select: { id: true, userId: true, read: true },
    });

    if (!notification) {
      sendError(res, 404, "Notification not found.");
      return;
    }

    if (notification.userId !== userId) {
      sendError(res, 403, "You can only mark your own notifications as read.");
      return;
    }

    if (notification.read) {
      sendSuccess(res, 200, "Notification already marked as read.", {
        id: notification.id,
        read: true,
      });
      return;
    }

    const updated = await prisma.notification.update({
      where: { id },
      data: { read: true },
    });

    sendSuccess(res, 200, "Notification marked as read.", updated);
  } catch (error) {
    next(error);
  }
}
