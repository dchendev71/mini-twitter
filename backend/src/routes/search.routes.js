import { Router } from "express"
import { searchPosts, searchUsers } from "../controllers/search.controller"
import { authenticateToken } from "../middleware/auth.middleware";

const router = Router();

router.get("/posts", authenticateToken, searchPosts)
router.get("/users", authenticateToken, searchUsers)

export default router;