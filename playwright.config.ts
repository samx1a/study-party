import { defineConfig } from "@playwright/test";

// Needs Postgres and a LiveKit server running (see README → "Run it locally").
export default defineConfig({
  testDir: "tests/e2e",
  timeout: 90_000,
  fullyParallel: false,
  reporter: [["list"]],
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3100",
    viewport: { width: 1280, height: 800 },
    permissions: ["camera", "microphone", "clipboard-read", "clipboard-write"],
    launchOptions: {
      // Fake camera + fake screen so tests run headless without prompts.
      args: [
        "--use-fake-ui-for-media-stream",
        "--use-fake-device-for-media-stream",
        "--auto-select-desktop-capture-source=Entire screen",
      ],
    },
    trace: "retain-on-failure",
  },
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3100",
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
