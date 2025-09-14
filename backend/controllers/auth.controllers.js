import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import users from "../models/user.models.js";
import logger from "../utils/logger.js";

import {
  generateAccessToken,
  generateRefreshToken,
} from "../utils/token.utils.js";

async function registerUser(req, res) {
  const { username, password } = req.body;
  if (users.find((u) => u.username === username)) {
    return res.status(400).json({ message: "Username already exists" });
  }
  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = { id: users.length + 1, username, password: hashedPassword };
  users.push(newUser);

  logger.info("User created", { username });
  res.json({ message: "User created" });
}

async function loginUser(req, res) {
  const { username, password } = req.body;
  const user = users.find((u) => u.username === username);
  if (!user || !(await bcrypt.compare(password, user.password))) {
    logger.error("Failed login attempt", { username });
    return res.status(401).json({ message: "Invalid credentials" });
  }
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);
  res.json({ accessToken, refreshToken });
}

function refreshToken(req, res) {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.sendStatus(401);
  jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    const newAccessToken = generateAccessToken(user);
    res.json({ accessToken: newAccessToken });
  });
}

export { registerUser, loginUser, refreshToken };
