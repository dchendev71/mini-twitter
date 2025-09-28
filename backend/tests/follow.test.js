import { clearDatabase, createUsersAndReturnAccessTokens, sendPostAuthorizedRequest} from "./testsUtils.js";

let accessTokens

beforeAll(async () => {
    await clearDatabase();
    accessTokens = await createUsersAndReturnAccessTokens(10);
})

describe("Follow routes", () => {
    it("should return 400, can't follow yourself", async() => {
        const tokenUser0 = accessTokens[0]
        const res = await sendPostAuthorizedRequest("/follow/1", tokenUser0, "")

        expect(res.statusCode).toBe(400);
        expect(res.body).toHaveProperty("message", "can not follow yourself");
    })
}

)