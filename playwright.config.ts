import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",

  fullyParallel: true,
  forbidOnly: !!process.env.CI,

  retries: process.env.CI ? 0 : 0,
  workers: process.env.CI ? 2 : 3,

  timeout: 120000,

  expect: {
    timeout: 15000,
  },

  reporter: [
  ['list'],
  ['html', { outputFolder: 'test-results/html-report', open: 'never' }],
  ['json', { outputFile: 'test-results/results.json' }],
  ['junit', { outputFile: 'test-results/junit.xml' }],
  ['allure-playwright']
],

  use: {
    headless: true,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    actionTimeout: 30000,
    navigationTimeout: 60000,
  },

  projects: [
    {
      name: "chromium",
      use: {
        browserName: "chromium",
        viewport: null,
        launchOptions: {
          slowMo: process.env.CI ? 0 : 500,
          args: ["--start-maximized", "--disable-dev-shm-usage"],
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
  ],

  outputDir: "artifacts",
});
