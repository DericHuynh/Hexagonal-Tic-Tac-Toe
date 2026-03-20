import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "sqlite",
  driver: "d1-http",
  schema: "../../../packages/db/src/do-schema.ts",
  out: "./drizzle/do-migrations",
});
