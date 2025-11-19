import { clearDatabase, sendAuthorizedRequest } from "./testsUtils"
import prisma from "../src/prismaClient.js";
import jwt from "jsonwebtoken"
import { USERNAME, PASSWORD, EMAIL } from "./setupTests.js";

let token;
let user;
let posts;

beforeAll(async() => {
    await clearDatabase();

    user = await prisma.user.create({
        data: { username: USERNAME, password: PASSWORD, email: EMAIL },
    });

    token = jwt.sign(
        { id: user.id, username: user.username },
        process.env.JWT_SECRET,
        { expiresIn: "15m" },
    );

    // Create a post under which we wil write comments
    await prisma.post.createMany({
        data: [
            { authorId: user.id, text: "Post A"},
            { authorId: user.id, text: "Post B"},
            { authorId: user.id, text: "Post C"}
        ]
    })

    posts = await prisma.post.findMany({
        where: {
            authorId: user.id
        }
    })
})

describe("Add Comment", () => {

    it("Should add a comment to a post when authenticated", async() => {
        const res = await sendAuthorizedRequest(
            "POST", 
            `/comment/${posts[0].id}/`,
            token,
            "Your post is awesome!"
        )
        expect(res.statusCode).toBe(201);
    })

    it("Should return 400, comment is empty", async() => {
        const res = await sendAuthorizedRequest(
            "POST", 
            `/comment/${posts[0].id}/`,
            token,
            ""
        )
        expect(res.statusCode).toBe(400);
    })

    it("Should return 500, invalid value", async() => {
        const res = await sendAuthorizedRequest(
            "POST", 
            `/comment/${posts[0].id}/`,
            token,
            7,            
        )
        expect(res.statusCode).toBe(500);
    })

    it("Should return 200, getComments", async() => {
        const res = await sendAuthorizedRequest(
            "GET",
            `/comment/${posts[0].id}/`,
            token, ""
        )

        expect(res.statusCode).toBe(200);
    })
})