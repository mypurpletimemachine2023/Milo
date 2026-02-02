import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

// Single-process local dev DB.
// For production we can swap to Postgres or libSQL + migrations.
const adapter = new PrismaBetterSqlite3({ url: "file:./prisma/dev.db" });

export const db = new PrismaClient({ adapter });
