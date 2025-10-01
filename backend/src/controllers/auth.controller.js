import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import logger from "../utils/logger.js";
import prisma from "../prismaClient.js";

import {
  generateAccessToken,
  generateRefreshToken,
} from "../utils/token.utils.js";

async function registerUser(req, res) {
  const { username, password, email } = req.body;

  if (!username || !password || !email) {
    return res
      .status(400)
      .json({ message: "username, password and email required" });
  }

  if (await checkIfUserExists(username, email)) {
    return res
      .status(400)
      .json({ message: "username or email already in use" });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: {
      username,
      email,
      password: hashedPassword,
    },
  });

  logger.info("user created", { username });

  return res.json({
    message: "user created",
    user: { id: user.id, username: user.username, email: user.email },
  });
}

async function checkIfUserExists(username, email) {
  if (await prisma.user.findUnique({ where: { username } })) {
    return true;
  }
  if (await prisma.user.findUnique({ where: { email } })) {
    return true;
  }
  return false;
}

async function loginUser(req, res) {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ message: "username and password required" });
  }
  const user = await prisma.user.findUnique({ where: { username } });
  if (!user || !(await bcrypt.compare(password, user.password))) {
    // We do not want to tell them that the user does not exist
    logger.error("failed login attempt", { username });
    return res.status(401).json({ message: "invalid credentials" });
  }
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);
  return res.json({ accessToken, refreshToken });
}

function refreshToken(req, res) {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.sendStatus(401);
  jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET, (err, payload) => {
    if (err) return res.sendStatus(403);
    const newAccessToken = generateAccessToken({
      id: payload.id,
      username: payload.username,
    });
    return res.json({ accessToken: newAccessToken });
  });
}

export { registerUser, loginUser, refreshToken };
