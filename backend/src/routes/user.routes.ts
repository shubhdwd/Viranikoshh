import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware";
import {
  getPublicProfile,
  updateMe,
  getMyInterests,
  getMyFollowing,
  getMySaves,
  getSuggestedUsers,
} from "../controllers/user.controller";
import {
  followUser,
  unfollowUser,
} from "../controllers/social.controller";

const router = Router();

// Protected (must come before /:id to avoid route conflict)
router.get("/suggested", authMiddleware, getSuggestedUsers);
router.get("/me/interests", authMiddleware, getMyInterests);
router.get("/me/following", authMiddleware, getMyFollowing);
router.get("/me/saves", authMiddleware, getMySaves);

// Public
router.get("/:id", getPublicProfile);

// Protected
router.patch("/me", authMiddleware, updateMe);
router.post("/:id/follow", authMiddleware, followUser);
router.delete("/:id/follow", authMiddleware, unfollowUser);

export default router;
