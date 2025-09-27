import { execSync } from "child_process";
import dotenv from "dotenv"

dotenv.config()

process.env.DATABASE_URL = process.env.DATABASE_URL_TEST;

export default async function globalSetup() {
    console.log(`Resetting test database: ${process.env.DATABASE_URL_TEST}`);
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