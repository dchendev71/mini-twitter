import dotenv from "dotenv";
import redis from "../src/redisClient";
import { fanoutQueue } from "../src/queues/fanoutQueue";
import { fanoutWorker } from "../src/workers/fanoutWorker";

dotenv.config();

const USERNAME = "testuser";
const PASSWORD = "testpwd";
const EMAIL = "testuser@test.com";

afterAll(async () => {
  await redis.quit();
  await fanoutQueue.close();
  await fanoutWorker.close();
});

export { USERNAME, PASSWORD, EMAIL };
