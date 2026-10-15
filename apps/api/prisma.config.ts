import "dotenv/config";
import { defineConfig } from "prisma/config";

const generationOnlyUrl = "postgresql://local:local@prisma-generation-only.invalid:5432/trustexam";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx src/prisma/seed.ts",
  },
  datasource: {
    url: process.env.DATABASE_URL ?? generationOnlyUrl,
  },
});
