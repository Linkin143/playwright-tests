import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./generated-tests",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 1,
  workers: 1,

  reporter: [
  ['html', { outputFolder: 'test-results/html-report', open: 'never' }],
  ['json', { outputFile: 'test-results/results.json' }],
  ['list'],
  ['junit', { outputFile: 'test-results/junit.xml' }]
],

  use: {
    trace: "retain-on-failure",
    // screenshot: "only-on-failure",
    screenshot: "on",
    video: "retain-on-failure",
    actionTimeout: 30000,
    navigationTimeout: 60000,
    headless:false,
    launchOptions: {
    slowMo: 500, 
  },
  },

  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1920, height: 1080 },
      },
    },
    {
      name: "firefox",
      use: {
        ...devices["Desktop Firefox"],
        viewport: { width: 1920, height: 1080 },
      },
    },
    {
      name: "webkit",
      use: {
        ...devices["Desktop Safari"],
        viewport: { width: 1920, height: 1080 },
      },
    },
  ],

  outputDir: "artifacts",
});
