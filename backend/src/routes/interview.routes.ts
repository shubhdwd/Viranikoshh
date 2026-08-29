import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware";
import { uploadSingle } from "../middleware/upload.middleware";
import { strictLimiter } from "../middleware/rateLimit.middleware";
import {
  createInterview,
  getInterview,
  addQuestions,
  uploadAudioResponse,
  completeInterview,
  publishInterview,
} from "../controllers/interview.controller";

const router = Router();

// All interview routes require authentication
router.post("/", authMiddleware, strictLimiter, createInterview);
router.get("/:id", authMiddleware, getInterview);
router.post("/:id/questions", authMiddleware, addQuestions);
router.post("/:id/audio", authMiddleware, uploadSingle("audio"), uploadAudioResponse);
router.post("/:id/complete", authMiddleware, completeInterview);
router.post("/:id/publish", authMiddleware, publishInterview);

export default router;
