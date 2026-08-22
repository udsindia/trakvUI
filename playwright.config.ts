import { defineConfig, devices } from "@playwright/test";

/**
 * Two projects:
 *   unit — pure functions, no browser, no running app. Always safe to run.
 *   e2e  — drives the real UI, so it needs the local stack up (see below).
 *
 * The e2e suite WRITES DATA (creates leads, enrols students, reassigns records), so it is
 * pinned to the disposable local copy and never the deployed app. `API_BASE_URL` must point
 * at a localhost backend running against trakv_verify; tests/fixtures.ts refuses to run
 * otherwise. Never point this at Aiven.
 *
 * Prerequisites for `npm run test:e2e`:
 *   1. Postgres with the trakv_verify database.
 *   2. The backend on :8081 against it, e.g.
 *        SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/trakv_verify?sslmode=disable&stringtype=unspecified \
 *        SPRING_DATASOURCE_USERNAME=postgres SPRING_DATASOURCE_PASSWORD=postgres \
 *        SPRING_DATASOURCE_SSL_MODE=disable SERVER_PORT=8081 ./mvnw spring-boot:run
 *   Playwright starts the frontend itself on :3101 (see webServer below).
 */
const API_BASE_URL = process.env.E2E_API_BASE_URL ?? "http://localhost:8081/api";
const APP_PORT = Number(process.env.E2E_APP_PORT ?? 3101);
const APP_URL = `http://localhost:${APP_PORT}`;

export default defineConfig({
  testDir: "./tests",
  fullyParallel: false, // the e2e specs share one tenant's data
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : [["list"]],

  use: {
    baseURL: APP_URL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },

  projects: [
    {
      name: "unit",
      testMatch: /.*\.unit\.spec\.ts/,
      use: {},
    },
    {
      name: "e2e",
      testMatch: /.*\.e2e\.spec\.ts/,
      use: { ...devices["Desktop Chrome"] },
    },
  ],

  // Only the frontend — the backend is yours to start, since it owns the database.
  webServer: {
    command: `npx vite --port ${APP_PORT} --strictPort`,
    url: APP_URL,
    reuseExistingServer: true,
    timeout: 120_000,
    env: { VITE_API_BASE_URL: API_BASE_URL },
  },
});

export { API_BASE_URL, APP_URL };
