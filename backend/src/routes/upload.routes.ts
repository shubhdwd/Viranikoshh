import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware";
import { uploadSingle } from "../middleware/upload.middleware";
import { strictLimiter } from "../middleware/rateLimit.middleware";
import {
  uploadMedia,
  getUploadStatus,
} from "../controllers/upload.controller";

const router = Router();

// Protected routes — strict limit on uploads (write-heavy)
router.post("/", authMiddleware, strictLimiter, uploadSingle("file"), uploadMedia);
router.get("/:id/status", authMiddleware, getUploadStatus);

export default router;
