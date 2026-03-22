import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
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
    screenshot: "on",
    video: "retain-on-failure",
    actionTimeout: 30000,
    navigationTimeout: 60000,
    headless: false,
  },

  projects: [
    {
      name: "chromium",
      use: {
        browserName: "chromium",
        viewport: null,
        launchOptions: {
          slowMo: 500,
          args: ['--start-maximized']
        },
      },
    },
    {
      name: "firefox",
      use: {
        browserName: "firefox",
        viewport: null,
      },
    },
    {
      name: "webkit",
      use: {
        browserName: "webkit",
        viewport: null,
      },
    },
  ],

  outputDir: "artifacts",
});