import { Queue } from "bullmq";
import redis from "../redisClient.js";

export const fanoutQueue = new Queue("fanout", { connection: redis });
