import request from "supertest";
import jwt from "jsonwebtoken";
import app from "../server.js"; // export app from server.js
import { USERNAME, PASSWORD, EMAIL } from "./setupTests.js";
import { clearDatabase } from "./clearDatabase.js";

const bodyWithEmail = {
  username: USERNAME,
  password: PASSWORD,
  email: EMAIL,
};

const body = {
  username: USERNAME,
  password: PASSWORD,
};

async function getResponse(route, body) {
  return request(app).post(route).send(body);
}

beforeAll(async () => {
  await clearDatabase();
});

describe("Auth Routes", () => {
  it("should fail registering user, missing email", async () => {
    const res = await getResponse("/auth/register", body);

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty(
      "message",
      "username, password and email required",
    );
  });

  it("should register a user", async () => {
    const res = await getResponse("/auth/register", bodyWithEmail);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("message", "user created");
  });

  it("should not register same username twice", async () => {
    const res = await getResponse("/auth/register", bodyWithEmail);

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty(
      "message",
      "username or email already in use",
    );
  });

  it("should not register same email twice, different username", async () => {
    const payload = {
      username: "TEST",
      password: PASSWORD,
      email: EMAIL,
    };

    const res = await getResponse("/auth/register", payload);

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty(
      "message",
      "username or email already in use",
    );
  });

  it("should fail login, missing password", async () => {
    const payload = { username: USERNAME };
    const res = await getResponse("/auth/login", payload);

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty(
      "message",
      "username and password required",
    );
  });

  it("should fail login, missing username", async () => {
    const payload = { password: PASSWORD };
    const res = await getResponse("/auth/login", payload);

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty(
      "message",
      "username and password required",
    );
  });

  it("should login succesfully", async () => {
    const res = await getResponse("/auth/login", body);

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual(
      expect.objectContaining({
        accessToken: expect.any(String),
        refreshToken: expect.any(String),
      }),
    );
  });

  it("should fail login", async () => {
    const res = await getResponse("/auth/login", {
      username: USERNAME,
      password: PASSWORD + "123",
    });
    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty("message", "invalid credentials");
  });

  it("should issue a new access token with a valid refresh token", async () => {
    const loginResponse = await getResponse("/auth/login", body);
    const { refreshToken } = loginResponse.body;
    const refreshResponse = await getResponse("/auth/refresh", {
      refreshToken,
    });

    expect(refreshResponse.statusCode).toBe(200);
    expect(refreshResponse.body).toEqual(
      expect.objectContaining({
        accessToken: expect.any(String),
      }),
    );
  });

  it("should return 401 missing refresh token", async () => {
    await getResponse("/auth/login", body);
    const refreshResponse = await getResponse("/auth/refresh", {});

    expect(refreshResponse.statusCode).toBe(401);
  });

  it("should return 403, wrong refresh token", async () => {
    await getResponse("/auth/login", body);
    const refreshResponse = await getResponse("/auth/refresh", {
      refreshToken: "WRONGTOKEN",
    });

    expect(refreshResponse.statusCode).toBe(403);
  });
});

describe("authenticateToken middleware", () => {
  it("should return 401 if no token is provided", async () => {
    const res = await request(app).get("/profile");

    expect(res.statusCode).toBe(401);
  });

  it("should return 403 if token is invalid", async () => {
    const res = await request(app)
      .get("/profile")
      .set("Authorization", "Bearer invalid.token.here");

    expect(res.statusCode).toBe(403);
  });

  it("should allow access if token is valid", async () => {
    const validToken = jwt.sign(
      { id: 1, username: USERNAME },
      process.env.JWT_SECRET,
      { expiresIn: "15m" },
    );

    const res = await request(app)
      .get("/profile")
      .set("Authorization", `Bearer ${validToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("message", `Hello ${USERNAME}`);
  });
});
