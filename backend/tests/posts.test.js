import { app } from "./setupTests.js";
import prisma from "../src/prismaClient.js";
import jwt from "jsonwebtoken";
import request from "supertest";
import { USERNAME, PASSWORD, EMAIL } from "./setupTests.js";
import { clearDatabase, sendAuthorizedRequest } from "./testsUtils.js";
import { REDIS_POST_PATH } from "../src/redisClient.js";

let token;
let user;

beforeAll(async () => {
  await clearDatabase();

  user = await prisma.user.create({
    data: { username: USERNAME, password: PASSWORD, email: EMAIL },
  });

  token = jwt.sign(
    { id: user.id, username: user.username },
    process.env.JWT_SECRET,
    { expiresIn: "15m" },
  );
});

describe("POST /posts", () => {
  it("should create a post when authenticated", async () => {
    const res = await sendAuthorizedRequest(
      "POST",
      "/posts",
      token,
      "Hello World",
    );

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty("message", "post created succesfully");
  });

  it("should return 403 if content is empty", async () => {
    const res = await sendAuthorizedRequest("POST", "/posts", token, "");
    expect(res.statusCode).toBe(403);
  });

  it("should return 401 if no token provided", async () => {
    const res = await request(app).post("/posts").send({ content: "No auth" });
    expect(res.statusCode).toBe(401);
  });

  it("should return 500 because content is not an string", async () => {
    const res = await sendAuthorizedRequest(
      "POST",
      "/posts",
      token,
      12312421312,
    );
    expect(res.statusCode).toBe(500);
  });
});

describe("Test getTimeline", () => {
  let newUser;
  let newToken;
  let redis;
  beforeAll(async () => {
    redis = app.locals.redis;
    // Create a new user which will also create posts
    newUser = await prisma.user.create({
      data: {
        username: USERNAME + "new",
        password: PASSWORD,
        email: EMAIL + "new",
      },
    });

    newToken = jwt.sign(
      { id: newUser.id, username: newUser.username },
      process.env.JWT_SECRET,
      { expiresIn: "15m" },
    );

    await prisma.post.createMany({
      data: [
        { authorId: newUser.id, text: "Post A" },
        { authorId: newUser.id, text: "Post B" },
        { authorId: newUser.id, text: "Post C" },
      ],
    });

    const allPosts = await prisma.post.findMany({
      where: { authorId: newUser.id },
    });
    const ts = Date.now();
    for (const [i, post] of allPosts.entries()) {
      await redis.zadd(`user:posts:${newUser.id}`, ts + i, post.id);
    }
  });
  // Create multiple posts
  it("should return posts from Redis in descending order", async () => {
    const res = await sendAuthorizedRequest(
      "POST",
      "/posts/timeline",
      newToken,
      "",
    );
    expect(res.statusCode).toBe(201);
    expect(res.body.posts).toBeDefined();
    expect(res.body.posts).toHaveLength(3);

    const postTexts = res.body.posts.map((p) => p.text);
    expect(postTexts).toEqual(
      expect.arrayContaining(["Post A", "Post B", "Post C"]),
    );
  });

  it("Should return posts without redis caching in descending order", async () => {
    await redis.del(REDIS_POST_PATH + newUser.id);
    const res = await sendAuthorizedRequest(
      "POST",
      "/posts/timeline",
      newToken,
      "",
    );
    expect(res.statusCode).toBe(201);
    expect(res.body.posts).toBeDefined();
    expect(res.body.posts).toHaveLength(3);
  });

  it("Should only return 2 element with limit specified", async () => {
    const res = await sendAuthorizedRequest(
      "POST",
      "/posts/timeline?limit=2",
      newToken,
      "",
    );
    expect(res.statusCode).toBe(201);
    expect(res.body.posts).toBeDefined();
    expect(res.body.posts).toHaveLength(2);
  });

  it("Should throw an error with an invalid redis", async () => {
    // Break redis
    const storedRedis = app.locals.redis;
    app.locals.redis = undefined;
    const res = await sendAuthorizedRequest(
      "POST",
      "/posts/timeline?limit=INVALID",
      newToken,
      "",
    );
    expect(res.statusCode).toBe(500);

    // Restore redis for shutdown
    app.locals.redis = storedRedis;
  });
});
