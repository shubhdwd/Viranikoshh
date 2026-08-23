import { Router } from "express";
import { register, login, getMe, logout } from "../controllers/auth.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import { authLimiter } from "../middleware/rateLimit.middleware";
import { prisma } from "../utils/prisma";
import { sendSuccess, sendError } from "../utils/apiResponse";

const router = Router();

// Public routes — strict rate limit to prevent brute-force
router.post("/register", authLimiter, register);
router.post("/login", authLimiter, login);

// Protected routes
router.get("/me", authMiddleware, getMe);
router.post("/logout", authMiddleware, logout);

// Test-only helper endpoints (only active in development)
if (process.env.NODE_ENV === "development") {
  const TEST_SECRET = "test-helper-viranikosh";
  // Set a user's role — for testing role revalidation
  router.post("/test/set-role", async (req, res) => {
    if (req.headers["x-test-secret"] !== TEST_SECRET) {
      sendError(res, 403, "Forbidden");
      return;
    }
    try {
      const { userId, role } = req.body as { userId: string; role: string };
      if (!userId || !role) {
        sendError(res, 400, "userId and role required");
        return;
      }
      const user = await prisma.user.update({
        where: { id: userId },
        data: { role },
        select: { id: true, role: true },
      });
      sendSuccess(res, 200, "Role updated.", user);
    } catch {
      sendError(res, 404, "User not found.");
    }
  });

  // Delete a user — for testing deleted-user rejection
  router.post("/test/delete-user", async (req, res) => {
    if (req.headers["x-test-secret"] !== TEST_SECRET) {
      sendError(res, 403, "Forbidden");
      return;
    }
    try {
      const { userId } = req.body as { userId: string };
      if (!userId) {
        sendError(res, 400, "userId required");
        return;
      }
      await prisma.user.delete({ where: { id: userId } });
      sendSuccess(res, 200, "User deleted.");
    } catch {
      sendError(res, 404, "User not found.");
    }
  });
}

export default router;
