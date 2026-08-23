import { Router } from "express";
import { getTaxonomy } from "../controllers/taxonomy.controller";

const router = Router();

router.get("/", getTaxonomy);

export default router;
