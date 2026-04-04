import jwt from "jsonwebtoken"
import { clearDatabase, createUsersAndReturnAccessTokens, sendAuthorizedRequest } from "./testsUtils"
import prisma from "../src/prismaClient";
import { USERNAME, EMAIL, PASSWORD } from "./setupTests";

let token;
let user;

let users;
const USER_COUNT = 10;
const POST_COUNT = 5;

beforeAll(async() => {
    await clearDatabase();
    user = await prisma.user.create({
        data: { username: USERNAME, password: PASSWORD, email: EMAIL}
    })

    token = jwt.sign(
        { id: user.id, username: user.username},
        process.env.JWT_SECRET,
        { expiresIn: "15m"},
    )

    users = await createUsersAndReturnAccessTokens(USER_COUNT);
    for (let i = 0; i < USER_COUNT; i++) {
        const currUser = users[0]['user']
        for (let j = 0; j < POST_COUNT; j++) {
            await prisma.post.create({
                data: {
                    authorId: currUser.id, text: "Text " + String(j)
                }
            })
        }
    }
}) 

describe("Test search posts", () => {
    it("Should return a list of post in the search", async() => {
        const res = await sendAuthorizedRequest(
            "GET",
            "/search/posts?q=Text",
            token,
            ""
        )

        expect(res.statusCode).toBe(200)
        expect(res.body.length).toEqual(USER_COUNT * POST_COUNT)
        for (let i = 0; i < USER_COUNT * POST_COUNT; i++) {
            expect(res.body[i]).toHaveProperty("text")
            expect(res.body[i]["text"]).toContain("Text")
        }
    })
    it("Should return 403, invalid parameters", async() => {
        const res = await sendAuthorizedRequest(
            "GET",
            "/search/posts",
            token,
            ""
        )

        expect(res.statusCode).toBe(403)
        expect(res.body).toHaveProperty("message", "Empty search parameters")
    })

    it("Should return 200, empty search result", async() => {
        const res = await sendAuthorizedRequest(
            "GET",
            "/search/posts?q=qwwwwwwnomatchwwwwq",
            token,
            ""
        )

        expect(res.statusCode).toBe(200)
        expect(res.body.length).toBe(0)
    })
})


describe("Test search users", () => {
    it("Should return a list of user in the search", async() => {
        const res = await sendAuthorizedRequest(
            "GET",
            `/search/users?q=${USERNAME}`,
            token,
            ""
        )

        expect(res.statusCode).toBe(200)
        expect(res.body.length).toEqual(USER_COUNT + 1)
        for (let i = 0; i < USER_COUNT + 1; i++) {
            expect(res.body[i]).toHaveProperty("username")
            expect(res.body[i]["username"]).toContain(USERNAME)
        }
    })

    it("should return 403, empty search parameters", async() => {
        const res = await sendAuthorizedRequest(
            "GET",
            "/search/users?q=",
            token,
            ""
        )

        expect(res.statusCode).toBe(403)
        expect(res.body).toHaveProperty("message", "Empty search parameters")
    })
})
