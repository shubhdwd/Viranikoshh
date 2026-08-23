import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware";
import {
  likePost,
  unlikePost,
  savePost,
  unsavePost,
  getComments,
  addComment,
} from "../controllers/social.controller";

const router = Router();

// Public
router.get("/:id/comments", getComments);

// Protected
router.post("/:id/like", authMiddleware, likePost);
router.delete("/:id/like", authMiddleware, unlikePost);
router.post("/:id/save", authMiddleware, savePost);
router.delete("/:id/save", authMiddleware, unsavePost);
router.post("/:id/comments", authMiddleware, addComment);

export default router;
