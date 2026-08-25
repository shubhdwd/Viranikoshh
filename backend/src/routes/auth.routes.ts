import { Router } from "express";
import { register, login, getMe, logout } from "../controllers/auth.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import { authLimiter } from "../middleware/rateLimit.middleware";
import { prisma } from "../utils/prisma";

const router = Router();

// Public routes — strict rate limit to prevent brute-force
router.post("/register", authLimiter, register);
router.post("/login", authLimiter, login);

// Protected routes
router.get("/me", authMiddleware, getMe);
router.post("/logout", authMiddleware, logout);

// ── Test-only helpers (gated by x-test-secret header, disabled in production) ──
if (process.env.NODE_ENV !== "production") {
  const TEST_SECRET = process.env.TEST_SECRET || "test-helper-viranikosh";

  // Promote/demote a user — used by E2E JWT revalidation tests
  router.post("/test/set-role", async (req, res) => {
    if (req.headers["x-test-secret"] !== TEST_SECRET) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    const { userId, role } = req.body as { userId?: string; role?: string };
    if (!userId || !role || !["USER", "ADMIN"].includes(role)) {
      res.status(400).json({ error: "userId and valid role required" });
      return;
    }
    await prisma.user.update({ where: { id: userId }, data: { role: role as any } });
    res.json({ success: true });
  });

  // Delete a user — used by E2E cleanup (schema cascades handle child records)
  router.post("/test/delete-user", async (req, res) => {
    if (req.headers["x-test-secret"] !== TEST_SECRET) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    const { userId } = req.body as { userId?: string };
    if (!userId) {
      res.status(400).json({ error: "userId required" });
      return;
    }
    try {
      await prisma.user.delete({ where: { id: userId } });
      res.json({ success: true });
    } catch {
      res.status(404).json({ error: "User not found" });
    }
  });
}

export default router;
