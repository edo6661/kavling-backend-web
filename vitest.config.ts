import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    fileParallelism: false,
    clearMocks: true,
    setupFiles: ["./src/tests/setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: [
        "node_modules/**",
        "dist/**",
        "prisma/**",
        "src/types/**",
        "**/*.d.ts",
        "src/tests/**",
      ],
    },
    poolOptions: {
      threads: {
        singleThread: true,
      },
    },
  },
});
