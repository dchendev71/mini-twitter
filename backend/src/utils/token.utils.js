import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

function generateAccessToken(user) {
  return jwt.sign(
    { id: user.id, username: user.username },
    process.env.JWT_SECRET,
    {
      expiresIn: "15m",
    },
  );
}

function generateRefreshToken(user) {
  return jwt.sign(
    { id: user.id, username: user.username },
    process.env.JWT_REFRESH_SECRET,
    {
      expiresIn: "7d",
    },
  );
}

export { generateAccessToken, generateRefreshToken };
