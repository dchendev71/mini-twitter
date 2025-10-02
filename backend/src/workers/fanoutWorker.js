import { Worker } from "bullmq";
import redis from "../redisClient.js";

const fanoutWorker = new Worker(
  "fanout",
  async (job) => {
    console.log("Received job:", job.name, job.data);
    // Sprint A: only log
  },
  { connection: redis },
);

fanoutWorker.on("completed", (job) => console.log(`Job ${job.id} completed`));
fanoutWorker.on("failed", (job, err) =>
  console.error(`Job ${job?.id} failed:`, err),
);

export { fanoutWorker };
