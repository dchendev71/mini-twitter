import { setupTestDb } from "./setupTestDb.js";
import dotenv from "dotenv";

dotenv.config();

beforeAll(async () => {
  process.env.DATABASE_URL = process.env.DATABASE_URL_TEST; // override DB URL
  await setupTestDb(); // reset DB before all tests
});
