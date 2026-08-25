import { Router } from "express";
import { getCulturalMap } from "../controllers/culturalMap.controller";
import { generalLimiter } from "../middleware/rateLimit.middleware";

const router = Router();

router.get("/", generalLimiter, getCulturalMap);

export default router;
