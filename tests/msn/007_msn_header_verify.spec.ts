import { test, expect } from '@playwright/test';

test.describe('MSN Home Page Header Verification', () => {
  test.setTimeout(120000);

  test('Verify MSN page title and header elements are visible', async ({ page }) => {
    test.slow();

    // Step 1: Navigate to MSN India
    // DOM before: blank page
    await page.goto('https://www.msn.com/en-in', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);
    // DOM after: MSN India home page loaded

    // Step 2: Handle any cookie/consent popups
    try {
      const acceptBtn = page.getByRole('button', { name: /accept|agree|ok/i });
      if (await acceptBtn.isVisible({ timeout: 3000 })) {
        await acceptBtn.click();
        await page.waitForTimeout(1000);
      }
    } catch {
      // No popup present, continue
    }

    // Step 3: Verify page title contains "MSN"
    // DOM before: page fully loaded, checking document title
    const title = await page.title();
    expect(title).toContain('MSN');
    // DOM after: title verified

    // Step 4: Verify MSN logo is visible in header
    // DOM before: inspecting header area for MSN logo (img or link with MSN branding)
    let logo = page.getByRole('link', { name: /msn/i }).first();
    if (!(await logo.isVisible({ timeout: 3000 }))) {
      logo = page.locator('header img[alt*="MSN"], a[aria-label*="MSN"], [class*="logo"]').first();
    }
    await expect(logo).toBeVisible({ timeout: 10000 });
    // DOM after: MSN logo confirmed visible in header

    // Step 5: Verify the web search box is visible in the header
    // DOM before: inspecting header for search input element
    let searchBox = page.getByRole('searchbox');
    if (!(await searchBox.isVisible({ timeout: 3000 }))) {
      searchBox = page.getByRole('combobox', { name: /search/i });
    }
    if (!(await searchBox.isVisible({ timeout: 3000 }))) {
      searchBox = page.locator('input[type="search"], input[name="q"], input[placeholder*="search" i]').first();
    }
    await expect(searchBox).toBeVisible({ timeout: 10000 });
    // DOM after: search box confirmed visible in header

    // Step 6: Verify "Open settings" button is visible in the header
    // DOM before: inspecting header for settings button
    let settingsBtn = page.getByRole('button', { name: /open settings/i });
    if (!(await settingsBtn.isVisible({ timeout: 3000 }))) {
      settingsBtn = page.getByLabel(/settings/i);
    }
    if (!(await settingsBtn.isVisible({ timeout: 3000 }))) {
      settingsBtn = page.locator('[aria-label*="settings" i], [title*="settings" i]').first();
    }
    await expect(settingsBtn).toBeVisible({ timeout: 10000 });
    // DOM after: Open settings button confirmed visible

    // Step 7: Verify "Personalize" button is visible in the header
    // DOM before: inspecting header for Personalize button
    let personalizeBtn = page.getByRole('button', { name: /personalize/i });
    if (!(await personalizeBtn.isVisible({ timeout: 3000 }))) {
      personalizeBtn = page.getByText(/personalize/i).first();
    }
    if (!(await personalizeBtn.isVisible({ timeout: 3000 }))) {
      personalizeBtn = page.locator('[aria-label*="personalize" i], [title*="personalize" i]').first();
    }
    await expect(personalizeBtn).toBeVisible({ timeout: 10000 });
    // DOM after: Personalize button confirmed visible
  });
});
