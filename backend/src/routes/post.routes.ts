import { Router } from "express";
import {
  authMiddleware,
  optionalAuthMiddleware,
} from "../middleware/auth.middleware";
import { strictLimiter } from "../middleware/rateLimit.middleware";
import {
  createPost,
  getFeed,
  getPostById,
  updatePost,
  deletePost,
  getRelatedPosts,
  createRelation,
} from "../controllers/post.controller";

const router = Router();

// Protected routes — strict limit on writes
router.post("/", authMiddleware, strictLimiter, createPost);
router.patch("/:id", authMiddleware, updatePost);
router.delete("/:id", authMiddleware, deletePost);
router.post("/:id/relations", authMiddleware, strictLimiter, createRelation);

// Public routes (optional auth lets draft-owners see their own drafts)
router.get("/feed", getFeed);
router.get("/:id", optionalAuthMiddleware, getPostById);
router.get("/:id/related", getRelatedPosts);

export default router;
