import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  reporter: [["html", { open: "never" }]],
  workers: 5,
  use: {
    headless: true,
    baseURL: "http://localhost:5173",
  },
  projects: [
    {
      name: "setup",
      testMatch: "auth.setup.spec.ts",
    },
    {
      name: "chrome",
      testMatch: "**/*.spec.ts",
      testIgnore: ["auth.setup.spec.ts"],
      use: {
        ...devices["Desktop Chrome"],
        channel: "chrome",
      },
      dependencies: ["setup"],
      teardown: "teardown",
    },
    {
      name: "teardown",
      testMatch: /global\.teardown\.ts/,
    },
  ],
  webServer: {
    command: "pnpm start:dev",
    port: 5173,
    reuseExistingServer: !process.env.CI,
  },
});
