import { Router } from "express";
import { createPost, getTimeline } from "../controllers/post.controller.js";
import { authenticateToken } from "../middleware/auth.middleware.js";

const router = Router();

router.post("/", authenticateToken, createPost);
router.post("/timeline", authenticateToken, getTimeline);

export default router;
