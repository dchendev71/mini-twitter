import { Router } from "express";
import { getComments, addComment } from "../controllers/comment.controller.js";
import { authenticateToken } from "../middleware/auth.middleware.js";

const router = Router();

router.get("/:postId/", authenticateToken, getComments);
router.post("/:postId/", authenticateToken, addComment)

export default router;