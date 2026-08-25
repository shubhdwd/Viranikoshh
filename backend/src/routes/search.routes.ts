import { Router } from "express";
import { searchPosts, searchSuggestions } from "../controllers/search.controller";
import { generalLimiter } from "../middleware/rateLimit.middleware";

const router = Router();

router.get("/", generalLimiter, searchPosts);
router.get("/suggestions", generalLimiter, searchSuggestions);

export default router;
