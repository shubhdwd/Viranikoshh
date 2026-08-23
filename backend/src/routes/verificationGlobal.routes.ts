import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware";
import {
  getVerificationQueue,
  getFlaggedPosts,
} from "../controllers/verification.controller";

const router = Router();

router.get("/queue", authMiddleware, getVerificationQueue);
router.get("/flagged", authMiddleware, getFlaggedPosts);

export default router;
