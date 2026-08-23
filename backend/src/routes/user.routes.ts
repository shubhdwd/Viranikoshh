import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware";
import {
  getPublicProfile,
  updateMe,
  getMyInterests,
  getSuggestedUsers,
} from "../controllers/user.controller";
import {
  followUser,
  unfollowUser,
} from "../controllers/social.controller";

const router = Router();

// Protected (must come before /:id to avoid route conflict)
router.get("/suggested", authMiddleware, getSuggestedUsers);

// Public
router.get("/:id", getPublicProfile);

// Protected
router.patch("/me", authMiddleware, updateMe);
router.get("/me/interests", authMiddleware, getMyInterests);
router.post("/:id/follow", authMiddleware, followUser);
router.delete("/:id/follow", authMiddleware, unfollowUser);

export default router;
