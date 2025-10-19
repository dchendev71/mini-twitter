import { Queue } from "bullmq";
import { getRedis } from "../redisClient";

let queueInstance = null;

export function getFanoutQueue() {
  if (!queueInstance) {
    queueInstance = new Queue("fanoutQueue", {
      connection: getRedis(), // inject Redis
    });
  }
  return queueInstance;
}

export async function closeFanoutQueue() {
  if (queueInstance) {
    await queueInstance.close();
    queueInstance = null;
  }
}
