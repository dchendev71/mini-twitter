import { Worker } from "bullmq";
import { getRedis } from "../redisClient";

let workerInstance = null;

export function getFanoutWorker(processFn) {
  if (!workerInstance) {
    workerInstance = new Worker(
      "fanoutQueue",
      processFn,
      { connection: getRedis() }
    );
  }
  return workerInstance;
}

export async function closeFanoutWorker() {
  if (workerInstance) {
    await workerInstance.close();
    workerInstance = null;
  }
}
