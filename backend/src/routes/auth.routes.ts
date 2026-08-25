import { Router } from "express";
import { register, login, getMe, logout } from "../controllers/auth.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import { authLimiter } from "../middleware/rateLimit.middleware";

const router = Router();

// Public routes — strict rate limit to prevent brute-force
router.post("/register", authLimiter, register);
router.post("/login", authLimiter, login);

// Protected routes
router.get("/me", authMiddleware, getMe);
router.post("/logout", authMiddleware, logout);

export default router;
