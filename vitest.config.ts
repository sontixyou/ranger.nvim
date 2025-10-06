/**
 * Vitest configuration for Ranger file explorer tests
 */

import { defineConfig } from "npm:vitest/config@^1.0.0";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["tests/**/*.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: [
        "node_modules/",
        "tests/",
        "**/*.test.ts",
        "**/*.config.ts",
      ],
    },
    // Test timeout (synchronous operations should be fast)
    testTimeout: 5000,
  },
});
