
import { closeRedis } from "../src/redisClient.js";
import { closeFanoutQueue } from "../src/queues/fanoutQueue.js";
import { closeFanoutWorker } from "../src/workers/fanoutWorker.js";
import { createAppInstance } from "./testsUtils.js";

let app

beforeAll(async () => {
  app = createAppInstance()  
})

afterAll(async () => {
  await closeFanoutWorker();
  await closeFanoutQueue();
  await closeRedis();
});

const USERNAME = "testuser";
const PASSWORD = "testpwd";
const EMAIL = "testuser@test.com";


export { USERNAME, PASSWORD, EMAIL, app };
