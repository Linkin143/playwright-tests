import { test, expect } from '@playwright/test';

/**
 * ID   : 9903
 * Name : msn_settings_panel
 * File : 9903_msn_settings_panel.spec.ts
 * Site : https://www.msn.com/en-in
 *
 * Live DOM findings (Apr 2026):
 *  - MSN settings button is a Fluent Web Component: fluent-button wraps inner button
 *  - "Open settings" outer: fluent-button[aria-label="Open settings"]
 *    has aria-expanded="false" when closed, aria-expanded="true" when open
 *  - "Close settings" inner: button[aria-label="Close settings"] — exists in DOM
 *    when panel is open (count=1), absent when closed (count=0)
 *  - getByRole('button', { name: 'Open settings' }) resolves to inner button → visible
 *  - Panel open assertion: aria-expanded="true" on fluent-button outer element
 *  - Panel closed assertion: aria-expanded="false" (or not "true") on same element
 *  - Settings panel shows a region/locale picker list when open
 */

test.describe('MSN – Settings Panel Opens and Closes Correctly', () => {
  test.describe.configure({ timeout: 120_000 });

  test('Verify settings panel opens and closes via Open/Close settings buttons', async ({ page }) => {
    test.slow();

    // ── 1-2 : Navigate and stabilize ──────────────────────────────
    await page.goto('https://www.msn.com/en-in', {
      waitUntil: 'domcontentloaded',
      timeout: 30_000,
    });
    await page.waitForTimeout(5000);
    console.log('[1-2] MSN loaded and stabilised');

    // Locators — defined once, re-used (Fluent WC is stable)
    const openBtn    = page.getByRole('button', { name: 'Open settings' });
    const fluentOpen = page.locator('fluent-button[aria-label="Open settings"]');
    const closeBtn   = page.locator('button[aria-label="Close settings"]');

    // ── 3 : Verify "Open settings" button is visible ──────────────
    await expect(openBtn).toBeVisible({ timeout: 10_000 });
    console.log('[3] "Open settings" button visible ✅');

    // ── 4 : Click "Open settings" ─────────────────────────────────
    await openBtn.click();
    await page.waitForTimeout(2500);
    console.log('[4] Clicked "Open settings"');

    // ── 5-6 : Verify settings panel is open ───────────────────────
    // Primary check: aria-expanded="true" on fluent-button wrapper
    // Secondary check: "Close settings" inner button exists in DOM
    await expect(fluentOpen).toHaveAttribute('aria-expanded', 'true', { timeout: 8_000 });
    await expect(closeBtn.first()).toBeAttached({ timeout: 8_000 });
    console.log('[5-6] Settings panel open confirmed (aria-expanded=true, Close button present) ✅');

    // ── 7 : Click "Close settings" ───────────────────────────────
    await closeBtn.first().click();
    await page.waitForTimeout(1500);
    console.log('[7] Clicked "Close settings"');

    // ── 8 : Verify settings panel is no longer open ───────────────
    await expect(fluentOpen).not.toHaveAttribute('aria-expanded', 'true', { timeout: 8_000 });
    console.log('[8] Settings panel closed (aria-expanded≠true) ✅');

    // ── 9 : Verify "Open settings" button is visible again ────────
    await expect(openBtn).toBeVisible({ timeout: 10_000 });
    console.log('[9] "Open settings" button visible again ✅');

    console.log('\n✅ ALL ASSERTIONS PASSED');

  }); // end test
}); // end describe
