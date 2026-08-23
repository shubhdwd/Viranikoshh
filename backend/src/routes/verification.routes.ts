import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware";
import {
  verifyPost,
  suggestCorrection,
  getVerifications,
} from "../controllers/verification.controller";

const router = Router();

router.post("/:id/verify", authMiddleware, verifyPost);
router.post("/:id/corrections", authMiddleware, suggestCorrection);
router.get("/:id/verifications", authMiddleware, getVerifications);

export default router;
