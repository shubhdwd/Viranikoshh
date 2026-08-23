import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware";
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "../controllers/notification.controller";

const router = Router();

// Protected — all notification routes require authentication
router.get("/", authMiddleware, getNotifications);
router.patch("/read-all", authMiddleware, markAllNotificationsRead);
router.patch("/:id/read", authMiddleware, markNotificationRead);

export default router;
