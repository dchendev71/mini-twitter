import { Router } from "express";
import { getComments, addComment } from "../controllers/comment.controller";
import { authenticateToken } from "../middleware/auth.middleware";

const router = Router();

router.get("/:postId/", authenticateToken, getComments);
router.post("/:postId/", authenticateToken, addComment)

export default router;