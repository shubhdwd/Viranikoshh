import { Router } from "express";
import { getCulturalMap } from "../controllers/culturalMap.controller";

const router = Router();

router.get("/", getCulturalMap);

export default router;
