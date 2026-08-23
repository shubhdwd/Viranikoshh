import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware";
import {
  followInterest,
  unfollowInterest,
} from "../controllers/interest.controller";

const router = Router();

// Protected — all interest routes require authentication
router.post("/:categoryId/follow", authMiddleware, followInterest);
router.delete("/:categoryId/follow", authMiddleware, unfollowInterest);

export default router;
