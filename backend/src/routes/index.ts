import { Router } from "express";
import authRoutes from "./auth.routes";
import postRoutes from "./post.routes";
import uploadRoutes from "./upload.routes";
import socialRoutes from "./social.routes";
import searchRoutes from "./search.routes";
import interviewRoutes from "./interview.routes";
import verificationRoutes from "./verification.routes";
import verificationGlobalRoutes from "./verificationGlobal.routes";
import notificationRoutes from "./notification.routes";
import userRoutes from "./user.routes";
import culturalMapRoutes from "./culturalMap.routes";
import interestRoutes from "./interest.routes";
import taxonomyRoutes from "./taxonomy.routes";
import { checkProviders } from "../ai/providers";

const router = Router();

// API Health Check (includes AI provider status)
router.get("/health", async (_req, res) => {
  try {
    const providers = await checkProviders();
    res.json({
      status: "OK",
      message: "Viranikosh API is running",
      providers,
    });
  } catch {
    res.status(503).json({
      status: "ERROR",
      message: "Health check failed",
      providers: [],
    });
  }
});

// Mount routes
router.use("/auth", authRoutes);
router.use("/posts", postRoutes);
// Social, Verification, and Corrections are nested under /posts/:id in brain file,
// but for cleaner routing we can mount them at /posts and let the sub-routers handle the :id
router.use("/posts", socialRoutes);
router.use("/posts", verificationRoutes);
router.use("/verification", verificationGlobalRoutes);

router.use("/uploads", uploadRoutes);
router.use("/search", searchRoutes);
router.use("/interviews", interviewRoutes);
router.use("/notifications", notificationRoutes);
router.use("/users", userRoutes);
router.use("/cultural-map", culturalMapRoutes);
router.use("/interests", interestRoutes);
router.use("/taxonomy", taxonomyRoutes);

export default router;
