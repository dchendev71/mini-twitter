import { app, EMAIL, PASSWORD, USERNAME } from "./setupTests.js";
import jwt from "jsonwebtoken"
import { clearDatabase, sendAuthorizedRequest } from "./testsUtils";

let token;
let user;
let post;

beforeAll(async() => {
    await clearDatabase();
    user = await prisma.user.create({
        data: { username: USERNAME, password: PASSWORD, email: EMAIL}
    });

    token = jwt.sign(
        { id: user.id, username: user.username },
        process.env.JWT_SECRET, 
        { expiresIn: "15m"},
    );

    post = await prisma.post.create({
      data: { text: "This is a test post", authorId: user.id },
    });
})


describe("Like feature", () => {
    let redis;
    beforeAll(async() => {
        redis = app.locals.redis
    });

    it("Should like a post succesfully", async() => {
        const res = await sendAuthorizedRequest(
            "POST",
            `/posts/${post.id}/like`,
            token, ""
        )

        expect(res.statusCode).toBe(201);
        expect(res.body).toHaveProperty("message", "Post liked")
    })

    it("Should return 400, post already liked", async() => {
        const res = await sendAuthorizedRequest(
            "POST",
            `/posts/${post.id}/like`,
            token, ""
        )

        expect(res.statusCode).toBe(400);
        expect(res.body).toHaveProperty("message", "Post already liked")
    })

    it("Should return 500, postId is invalid", async() => {
        const res = await sendAuthorizedRequest(
            "POST",
            `/posts/Invalid/like`,
            token, ""
        )

        expect(res.statusCode).toBe(500);
        expect(res.body).toHaveProperty("message", "Failed to like post")
    })

    it("Should return 400, post not liked (postId.id) + 1", async() => {
        const res = await sendAuthorizedRequest(
            "DELETE",
            `/posts/${post.id + 1}/like`,
            token, ""
        )

        expect(res.statusCode).toBe(400)
        expect(res.body).toHaveProperty("message", "Can not unlike if not liked before")
    })

    it("Should return 200, post has been liked, count should be 1 and liked", async() => {
        const res = await sendAuthorizedRequest(
            "GET",
            `/posts/${post.id}/likes`,
            token, ""
        )

        expect(res.statusCode).toBe(200)
        expect(res.body).toHaveProperty("likes", 1)
        expect(res.body).toHaveProperty("liked", true)
    })

    it("Should return 200, unlike post", async() => {
        const res = await sendAuthorizedRequest(
            "DELETE",
            `/posts/${post.id}/like`,
            token, ""
        )

        expect(res.statusCode).toBe(200)
        expect(res.body).toHaveProperty("message", "Post unliked")
    })

    it("Should return 500, unlike post invalid PostId", async () => {
        const res = await sendAuthorizedRequest(
            "DELETE",
            `/posts/invalidId/like`,
            token, ""
        )

        expect(res.statusCode).toBe(500)
        expect(res.body).toHaveProperty("message", "Failed to unlike post")
    })

    it("Should return 200, count is 0 and not liked", async() => {
        const res = await sendAuthorizedRequest(
            "GET",
            `/posts/${post.id}/likes`,
            token, ""
        )

        expect(res.statusCode).toBe(200)
        expect(res.body).toHaveProperty("likes", 0)
        expect(res.body).toHaveProperty("liked", false)
    })

    it("Should return 500, postId is invalid for getLikes", async() => {
        const res = await sendAuthorizedRequest(
            "GET",
            `/posts/invalidNumber/likes`,
            token, ""
        )

        expect(res.statusCode).toBe(500)
        expect(res.body).toHaveProperty("message", "Failed to get likes")
    })

    it("data not cached, check prisma directly, and redis add", async() =>{
        // Inject data
        await prisma.like.create({
        data: {
            userId: user.id,
            postId: post.id
        }
        })
        const res = await sendAuthorizedRequest(
            "GET",
            `/posts/${post.id}/likes`,
            token, ""
        )

        expect(res.statusCode).toBe(200)
        expect(res.body).toHaveProperty("likes", 1)
        expect(res.body).toHaveProperty("liked", true)
    })
})