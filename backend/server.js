import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.routes.js";
import { authenticateToken } from "./middleware/auth.middleware.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Routes
app.use("/auth", authRoutes);

// Example protected route
app.get("/profile", authenticateToken, (req, res) => {
  res.json({ message: `Hello ${req.user.username}` });
});

export default app;
