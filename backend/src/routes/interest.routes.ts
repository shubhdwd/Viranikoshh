import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware";
import {
  followInterest,
  unfollowInterest,
} from "../controllers/interest.controller";

const router = Router();

// Protected — all interest routes require authentication
router.post("/:categoryName/follow", authMiddleware, followInterest);
router.delete("/:categoryName/follow", authMiddleware, unfollowInterest);

export default router;
