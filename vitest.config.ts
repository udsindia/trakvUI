import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

/**
 * Unit tests and coverage.
 *
 * Playwright keeps the e2e specs — it drives a real browser against a real backend, which
 * is what those are for. The unit specs test pure functions and do not need a browser, so
 * they run here instead: Playwright has no coverage story for them, and coverage is the
 * whole point of measuring these.
 */
export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    include: ["tests/**/*.unit.spec.ts"],
    environment: "node",
    coverage: {
      provider: "v8",
      reporter: ["text-summary", "html", "lcov"],
      reportsDirectory: "coverage",
      // Only what the unit tests could plausibly reach. Pulling every .tsx in here would
      // bury a real number under a wall of untested components and make the figure useless.
      include: ["src/modules/**/*.ts", "src/config/**/*.ts", "src/shared/**/*.ts"],
      exclude: ["**/*.types.ts", "**/mock/**", "**/*MockData.ts", "**/*SeedData.ts", "**/index.ts"],
    },
  },
});
