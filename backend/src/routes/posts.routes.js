import { Router } from "express";
import { createPost } from "../controllers/post.controller.js";
import { authenticateToken } from "../middleware/auth.middleware.js";

const router = Router();

router.post("/", authenticateToken, createPost);

export default router;
