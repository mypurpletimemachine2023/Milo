import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  // Prisma 7+ moves connection strings out of schema.prisma
  datasource: {
    url: "file:./prisma/dev.db",
  },
});
