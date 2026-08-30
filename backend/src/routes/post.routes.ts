import { Router } from "express";
import {
  authMiddleware,
  optionalAuthMiddleware,
} from "../middleware/auth.middleware";
import { strictLimiter, generalLimiter } from "../middleware/rateLimit.middleware";
import {
  createPost,
  getFeed,
  getDrafts,
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

// Drafts — auth required, must be before /:id
router.get("/my/drafts", authMiddleware, getDrafts);

// Public routes (optional auth lets draft-owners see their own drafts)
router.get("/feed", generalLimiter, getFeed);
router.get("/:id", optionalAuthMiddleware, generalLimiter, getPostById);
router.get("/:id/related", generalLimiter, getRelatedPosts);

export default router;
