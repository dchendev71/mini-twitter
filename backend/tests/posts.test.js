import request from "supertest";
import app from "../server.js";
import prisma from "../prismaClient.js";
import jwt from "jsonwebtoken";
import { USERNAME, PASSWORD, EMAIL } from "./setupTests.js";
import { clearDatabase } from "./clearDatabase.js";

beforeAll(async() => {
  await clearDatabase();
});

describe("POST /posts", () => {
  let token;
  let user;

  beforeAll(async () => {
    // create a test user in DB
    user = await prisma.user.create({
      data: { username: USERNAME, password: PASSWORD, email: EMAIL },
    });

    token = jwt.sign(
      { id: user.id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: "15m" }
    );
  });

  afterAll(async () => {
    await prisma.post.deleteMany({});
    await prisma.user.deleteMany({});
  });

  it("should create a post when authenticated", async () => {
    const res = await request(app)
      .post("/posts")
      .set("Authorization", `Bearer ${token}`)
      .send({content: "Hello world"});

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty("message","post created succesfully");
  });

  it("should return 403 if content is empty", async () => {
    const res = await request(app)
      .post("/posts")
      .set("Authorization", `Bearer ${token}`)
      .send({content: ""});

    expect(res.statusCode).toBe(403);
  });

  it("should return 401 if no token provided", async () => {
    const res = await request(app).post("/posts").send({ content: "No auth" });
    expect(res.statusCode).toBe(401);
  });
});
