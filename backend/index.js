import createApp from "./app.js";
import { getFanoutQueue } from "./src/queues/fanoutQueue.js";
import { getRedis } from "./src/redisClient.js";
import { getFanoutWorker } from "./src/workers/fanoutWorker.js";

// Start server
const PORT = process.env.PORT || 4000;

const app = createApp({
  redis: getRedis(), fanoutQueue: getFanoutQueue(), fanoutWorker: getFanoutWorker(),
})
app.listen(PORT, () =>
  console.log(`Auth server running on http://localhost:${PORT}`),
);
