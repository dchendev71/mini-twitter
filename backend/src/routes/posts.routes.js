import { Router } from "express";
import { createPost, getTimeline } from "../controllers/post.controller.js";
import { authenticateToken } from "../middleware/auth.middleware.js";
import { getLikes, likePost, unlikePost } from "../controllers/like.controller.js";

const router = Router();

router.post("/", authenticateToken, createPost);
router.post("/timeline", authenticateToken, getTimeline);

router.post("/:postId/like", authenticateToken, likePost);
router.delete("/:postId/like", authenticateToken, unlikePost);
router.get("/:postId/likes", authenticateToken, getLikes);

export default router;
