/// <reference types="vitest/config" />
import { defineConfig } from "vite-plus";

export default defineConfig({
  staged: {
    "*": "vp check --fix",
  },
  resolve: { tsconfigPaths: true },
  lint: { options: { typeAware: true, typeCheck: true } },
});
