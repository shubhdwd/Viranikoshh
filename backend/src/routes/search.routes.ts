import { Router } from "express";
import { searchPosts, searchSuggestions } from "../controllers/search.controller";

const router = Router();

router.get("/", searchPosts);
router.get("/suggestions", searchSuggestions);

export default router;
