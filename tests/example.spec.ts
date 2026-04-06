// tests/example.spec.ts
const { test, expect } = require('@playwright/test');

test('homepage test', async ({ page }) => {
  await page.goto('https://example.com');
  await expect(page).toHaveTitle(/Example/);
});