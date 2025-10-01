import {
  clearDatabase,
  createUsersAndReturnAccessTokens,
  sendAuthorizedRequest,
} from "./testsUtils.js";

import request from "supertest";
import app from "../server.js";

let users;
const USER_COUNT = 10;

beforeAll(async () => {
  await clearDatabase();
  users = await createUsersAndReturnAccessTokens(USER_COUNT);
});

describe("Follow routes", () => {
  it("should return 400, can't follow yourself", async () => {
    const { token, user } = users[0];
    const res = await sendAuthorizedRequest(
      "POST",
      `/follow/${user.id}`,
      token,
      "",
    );

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty("message", "can not follow yourself");
  });

  it("should return 201, follow succesful", async () => {
    const token = users[0]["token"];
    const user1 = users[1]["user"];

    const res = await sendAuthorizedRequest(
      "POST",
      `/follow/${user1.id}`,
      token,
      "",
    );

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty("message", "follow succesful");
  });

  it("should return 400, can't follow same person twice", async () => {
    const token = users[0]["token"];
    const user1 = users[1]["user"];

    const res = await sendAuthorizedRequest(
      "POST",
      `/follow/${user1.id}`,
      token,
      "",
    );

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty(
      "message",
      "can not follow same person twice",
    );
  });

  it("should return 500 because followee not an int", async () => {
    const token = users[0]["token"];

    const res = await sendAuthorizedRequest(
      "POST",
      "/follow/thisisastring",
      token,
      "",
    );

    expect(res.statusCode).toBe(500);
    expect(res.body).toHaveProperty("message", "failed to follow");
  });

  it("should return 201, unfollow succesful", async () => {
    const token = users[0]["token"];
    const user1 = users[1]["user"];

    const res = await sendAuthorizedRequest(
      "DELETE",
      `/follow/${user1.id}`,
      token,
      "",
    );

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty("message", "unfollow succesful");
  });

  it("should return 404, do not follow anymore, can't unfollow", async () => {
    const token = users[0]["token"];
    const user1 = users[1]["user"];

    const res = await sendAuthorizedRequest(
      "DELETE",
      `/follow/${user1.id}`,
      token,
      "",
    );

    expect(res.statusCode).toBe(404);
    expect(res.body).toHaveProperty("message", "you do not follow this user");
  });

  it("unfollow, should return 500 because followee not an int", async () => {
    const token = users[0]["token"];

    const res = await sendAuthorizedRequest(
      "DELETE",
      "/follow/thisisastring",
      token,
      "",
    );

    expect(res.statusCode).toBe(500);
    expect(res.body).toHaveProperty("message", "failed to unfollow");
  });

  it("should run without issue, follow everyone", async () => {
    const token = users[0]["token"];
    for (let i = 1; i < USER_COUNT; i++) {
      const currentUserId = users[i]["user"].id;
      const res = await sendAuthorizedRequest(
        "POST",
        `/follow/${currentUserId}`,
        token,
        "",
      );
      expect(res.statusCode).toBe(201);
    }
  });

  it("should list all followers", async () => {
    const user = users[0]["user"];
    const res = await request(app).get(`/follow/${user.id}/following`);

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveLength(USER_COUNT - 1);
  });

  it("should list all followee", async () => {
    const user = users[0]["user"];
    const res = await request(app).get(`/follow/${user.id}/followers`);

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveLength(0);
  });
});
