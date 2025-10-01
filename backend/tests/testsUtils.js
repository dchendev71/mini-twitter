import prisma from "../src/prismaClient.js";
import { USERNAME, PASSWORD, EMAIL } from "./setupTests.js";
import app from "../server.js";
import jwt from "jsonwebtoken";
import request from "supertest";

async function createUsersAndReturnAccessTokens(amount) {
  const accessTokens = [];
  for (let user = 0; user < amount; user++) {
    const username = USERNAME + user.toString();
    const created = await prisma.user.create({
      data: {
        username: username,
        password: PASSWORD,
        email: EMAIL + user.toString(),
      },
    });
    const token = jwt.sign(
      { id: created.id, username: created.username },
      process.env.JWT_SECRET,
      { expiresIn: "15m" },
    );
    accessTokens.push({ token: token, user: created });
  }
  return accessTokens;
}

async function clearDatabase() {
  // Delete from child tables first if you have foreign key constraints
  await prisma.like.deleteMany();
  await prisma.follow.deleteMany();
  await prisma.post.deleteMany(); // Posts depend on Users
  await prisma.user.deleteMany(); // Users last
  // Add other models here if needed
}

async function sendPostAuthorizedRequest(route, token, text) {
  return await request(app)
    .post(route)
    .set("Authorization", `Bearer ${token}`)
    .send({ content: text });
}

async function sendDeleteAuthorizedRequest(route, token, text) {
  return await request(app)
    .del(route)
    .set("Authorization", `Bearer ${token}`)
    .send({ content: text });
}

async function sendAuthorizedRequest(method, route, token, text) {
  switch (method) {
    case "POST":
      return sendPostAuthorizedRequest(route, token, text);
    case "DELETE":
      return sendDeleteAuthorizedRequest(route, token, text);
    case "GET":
      throw new Error("Not Implemented");
    case "UPDATE":
      throw new Error("Not Implemented");
  }
  throw new Error("Not Implemented");
}

export {
  clearDatabase,
  createUsersAndReturnAccessTokens,
  sendAuthorizedRequest,
};
