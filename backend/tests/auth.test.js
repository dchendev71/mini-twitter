import request from "supertest";
import app from "../server.js"; // export app from server.js

describe("Auth Routes", () => {
  it("should register a user", async () => {
    const res = await request(app)
      .post("/auth/register")
      .send({ username: "testuser", password: "pass123" });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("message", "User created");
  });

  it("should not register same username twice", async () => {
    const res = await request(app)
      .post("/auth/register")
      .send({ username: "testuser", password: "pass123" });

    expect(res.statusCode).toBe(400);
  });
});
