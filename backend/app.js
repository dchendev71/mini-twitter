import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./src/routes/auth.routes.js";
import postRoutes from "./src/routes/posts.routes.js";
import followRoutes from "./src/routes/follow.routes.js";

import { authenticateToken } from "./src/middleware/auth.middleware.js";
import { getFanoutQueue } from "./src/queues/fanoutQueue.js";
import { getFanoutWorker } from "./src/workers/fanoutWorker.js";

dotenv.config();

export default function createApp({ redis, fanoutQueue, fanoutWorker }) {
  const app = express();
  app.use(cors());
  app.use(bodyParser.json());

  // Routes
  app.use("/auth", authRoutes);
  app.use("/posts", postRoutes);
  app.use("/follow", followRoutes);

  // Example protected route
  app.get("/profile", authenticateToken, (req, res) => {
    res.json({ message: `Hello ${req.user.username}` });
  });
  // inject clients into controllers via req.app.locals
  app.locals.redis = redis;
  app.locals.fanoutQueue = fanoutQueue;
  app.locals.fanoutWorker = fanoutWorker;

  return app;
}
