import { Router } from "express";
import {
  unfollow,
  follow,
  getFollowers,
  getFollowing,
} from "../controllers/follow.controller.js";
import { authenticateToken } from "../middleware/auth.middleware.js";

const router = Router();

router.post("/:userId", authenticateToken, follow);
router.delete("/:userId", authenticateToken, unfollow);
router.get("/:userId/followers", getFollowers);
router.get("/:userId/following", getFollowing);

export default router;
