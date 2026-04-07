import { Router } from "express";
import { searchPosts, searchUsers } from "../controllers/search.controller.js";
import { authenticateToken } from "../middleware/auth.middleware.js";

const router = Router();

router.get("/posts", authenticateToken, searchPosts);
router.get("/users", authenticateToken, searchUsers);

export default router;
