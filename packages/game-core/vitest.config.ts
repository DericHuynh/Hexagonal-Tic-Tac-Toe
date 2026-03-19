import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    // game-core has no React or Cloudflare deps — pure unit tests
  },
})
