import request from "supertest";
import app from "../server.js"; // export app from server.js

const USERNAME = "testuser";
const body = {
  username: USERNAME,
  password: "pass123",
};

async function getResponse(route, body) {
  return request(app).post(route).send(body);
}

describe("Auth Routes", () => {
  it("should register a user", async () => {
    const res = await getResponse("/auth/register", body);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("message", "User created");
  });

  it("should not register same username twice", async () => {
    const res = await getResponse("/auth/register", body);

    expect(res.statusCode).toBe(400);
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
      password: "pass1234",
    });
    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty("message", "Invalid credentials");
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
