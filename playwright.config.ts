import { defineConfig, devices } from "@playwright/test";

const EXAMPLE_PORT = 3967;
const BASE_URL = `http://localhost:${EXAMPLE_PORT}`;

export default defineConfig({
  testDir: "e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: "html",
  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "npm run example:e2e",
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
