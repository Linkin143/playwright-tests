import { test, expect } from '@playwright/test';

test.describe('Google Search Tests', () => {
  test('should search for "Playwright automation" and verify results', async ({ page }) => {
    await page.goto('https://www.google.com');

    try {
      const cookieConsentButton = page.locator('button:has-text("Accept all"), button:has-text("I agree"), button:has-text("Accept")').first();
      await cookieConsentButton.waitFor({ timeout: 3000 });
      await cookieConsentButton.click();
    } catch (error) {
      // No cookie consent popup
    }

    const searchInput = page.locator('textarea[name="q"], input[name="q"]').first();
    await searchInput.waitFor({ state: 'visible' });
    await searchInput.fill('Playwright automation');
    await searchInput.press('Enter');

    await page.waitForLoadState('networkidle');
    await page.locator('#search, #rso').waitFor({ state: 'visible', timeout: 10000 });

    await expect(page).toHaveTitle(/Playwright/i);
  });
});