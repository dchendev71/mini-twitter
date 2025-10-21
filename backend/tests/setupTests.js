import { getRedis, closeRedis } from "../src/redisClient.js";
import { getFanoutQueue, closeFanoutQueue } from "../src/queues/fanoutQueue.js";
import {
  getFanoutWorker,
  closeFanoutWorker,
} from "../src/workers/fanoutWorker.js";
import createApp from "../app.js";

function createAppInstance() {
  return createApp({
    redis: getRedis(),
    fanoutQueue: getFanoutQueue(),
    fanoutWorker: getFanoutWorker(),
  });
}

let app;

beforeAll(async () => {
  app = createAppInstance();
});

afterAll(async () => {
  await closeFanoutWorker();
  await closeFanoutQueue();
  await closeRedis();
});

const USERNAME = "testuser";
const PASSWORD = "testpwd";
const EMAIL = "testuser@test.com";

export { USERNAME, PASSWORD, EMAIL, app };
