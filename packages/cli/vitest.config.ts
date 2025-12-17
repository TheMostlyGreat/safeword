import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts', 'src/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.test.ts', 'src/index.ts'],
    },
    // Increase timeout for integration tests that spawn processes
    // Default 30s isn't enough for npm installs in some tests
    testTimeout: 60_000,
    // Increase hook timeout for afterEach cleanup (rmSync with retries)
    // Default 10s isn't enough when npm has locked files
    hookTimeout: 30_000,
    // Run tests sequentially to avoid temp directory conflicts
    pool: 'forks',
    maxWorkers: 1,
  },
});
