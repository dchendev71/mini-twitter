import { execSync } from "child_process";

export async function setupTestDb() {
  console.log("Resetting test database...");
  // Run migrations against the test DB
  execSync(
    "DATABASE_URL=" +
      process.env.DATABASE_URL_TEST +
      " npx prisma migrate reset --force",
    {
      stdio: "inherit",
    },
  );
}
