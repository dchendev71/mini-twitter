import { Router } from "express"
import { unfollow, follow } from "../controllers/follow.controller.js";
import { authenticateToken } from "../middleware/auth.middleware.js";

const router = Router();

router.post("/:userId", authenticateToken, follow)
router.delete("/:userId", authenticateToken, unfollow)

export default router;