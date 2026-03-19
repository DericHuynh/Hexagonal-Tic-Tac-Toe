import { defineWorkersConfig } from "@cloudflare/vitest-pool-workers/config";

export default defineWorkersConfig({
  test: {
    include: [
      "test/**/*.test.ts",
      "packages/*/tests/**/*.test.ts",

      "packages/*/test/**/*.test.ts",
      "apps/*/test/**/*.test.ts",
    ],
    poolOptions: {
      workers: {
        wrangler: { configPath: "./apps/web/wrangler.jsonc" },
      },
    },
  },
});
