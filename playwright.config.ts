import { defineConfig } from "@playwright/test";
import { Status } from "allure-js-commons";
import * as os from "node:os";

export default defineConfig({
  testDir: "./tests",

  fullyParallel: true,
  forbidOnly: !!process.env.CI,

  retries: process.env.CI ? 0 : 0,
  workers: process.env.CI ? 2 : 2,

  timeout: 120000,

  expect: {
    timeout: 15000,
  },

  reporter: [
    ["list"],
    ["html", { outputFolder: "test-results/html-report", open: "never" }],
    ["json", { outputFile: "test-results/results.json" }],
    ["junit", { outputFile: "test-results/junit.xml" }],
    [
      "allure-playwright",
      {
        resultsDir: "allure-results",
        detail: true,
        suiteTitle: true,

        // 🔗 Link templates — customize to your tools
        links: {
          issue: {
            nameTemplate: "Issue #%s",
            urlTemplate: "https://issues.example.com/%s",
          },
          tms: {
            nameTemplate: "TMS #%s",
            urlTemplate: "https://tms.example.com/%s",
          },
          jira: {
            urlTemplate: (v: string) => `https://jira.example.com/browse/${v}`,
          },
        },

        // 🗂 Failure categories — handled HERE only (removed from workflow)
        categories: [
          {
            name: "⏱ Timeout Issues",
            messageRegex: ".*[Tt]imeout.*",
            traceRegex: ".*",
            matchedStatuses: [Status.FAILED, Status.BROKEN],
          },
          {
            name: "🔍 Element Not Found",
            messageRegex: ".*element.*|.*locator.*|.*selector.*",
            traceRegex: ".*",
            matchedStatuses: [Status.FAILED, Status.BROKEN],
          },
          {
            name: "✅ Assertion Failures",
            messageRegex: ".*expect.*|.*assert.*|.*toBe.*|.*toEqual.*",
            traceRegex: ".*",
            matchedStatuses: [Status.FAILED],
          },
          {
            name: "🌐 Navigation Failures",
            messageRegex: ".*navigation.*|.*net::ERR.*|.*ERR_.*",
            traceRegex: ".*",
            matchedStatuses: [Status.FAILED, Status.BROKEN],
          },
          {
            name: "🔐 Auth / Login Failures",
            messageRegex: ".*login.*|.*auth.*|.*401.*|.*403.*",
            traceRegex: ".*",
            matchedStatuses: [Status.FAILED, Status.BROKEN],
          },
          {
            name: "💥 Unexpected Errors",
            messageRegex: ".*",
            traceRegex: ".*",
            matchedStatuses: [Status.BROKEN],
          },
        ],

        // 🖥 Environment info — handled HERE only (removed from workflow)
        environmentInfo: {
          os_platform: os.platform(),
          os_release: os.release(),
          os_version: os.version(),
          node_version: process.version,
          ci: process.env.CI ? "GitHub Actions" : "Local",
          branch: process.env.GITHUB_REF_NAME ?? "local",
          actor: process.env.GITHUB_ACTOR ?? "local",
          run_number: process.env.GITHUB_RUN_NUMBER ?? "0",
          repository: process.env.GITHUB_REPOSITORY ?? "local",
        },
      },
    ],
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
      retries: 1,
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
      retries: 1,
      use: {
        browserName: "firefox",
        viewport: null,
        actionTimeout: 40000,
      },
    },
  ],

  outputDir: "artifacts",
});