import { test, expect } from '@playwright/test';

/**
 * ID   : 9904
 * Name : msn_personalize_dialog_structure
 * File : 9904_msn_personalize_dialog_structure.spec.ts
 * Site : https://www.msn.com/en-in
 *
 * Live DOM findings (Apr 2026):
 *  - Personalize button: role=button, aria-label~"Personalize your feed", force:true required
 *  - Dialog: role=dialog, aria-label="Personalize My Feed" — count=1, always visible
 *  - Discover tab:  role=treeitem, aria-label~"Navigate to Discover"  — count=1, visible=true
 *  - Following tab: role=treeitem, aria-label~"Navigate to Following" — count=1, visible=true
 *  - Blocked tab:   role=treeitem, aria-label~"Navigate to Blocked"   — count=1, visible=true
 *  - Channel search: role=searchbox, name="Search for channels to follow" — count=1, visible=true
 *  - Close button: scoped inside dialog, role=button, name="Close"    — count=1, visible=true
 *  - After Close click: dialog not.toBeVisible confirmed (dlgGone=true)
 */

test.describe('MSN – Personalize Dialog Has Correct Structure', () => {
  test.describe.configure({ timeout: 120_000 });

  test('Verify all dialog tabs, search field, and close button; then close dialog', async ({ page }) => {
    test.slow();

    // ── 1-2 : Navigate and stabilize ──────────────────────────────
    await page.goto('https://www.msn.com/en-in', {
      waitUntil: 'domcontentloaded',
      timeout: 30_000,
    });
    await page.waitForTimeout(5000);
    console.log('[1-2] MSN loaded and stabilised');

    // ── 3 : Click "Personalize" button ────────────────────────────
    let pBtn = page.getByRole('button', { name: /Personalize your feed/i });
    if (!(await pBtn.isVisible({ timeout: 5000 }).catch(() => false)))
      pBtn = page.getByText('Personalize', { exact: false }).first();
    await expect(pBtn).toBeVisible({ timeout: 10_000 });
    await pBtn.click({ force: true });
    console.log('[3] Personalize clicked');

    // ── 4 : Wait for Personalize My Feed dialog ────────────────────
    const dialog = page.getByRole('dialog', { name: 'Personalize My Feed' });
    await expect(dialog).toBeVisible({ timeout: 15_000 });
    await page.waitForTimeout(500);
    console.log('[4] Dialog "Personalize My Feed" opened ✅');

    // ── 5 : Verify "Discover" tab is visible inside dialog ────────
    const discoverTab = page.getByRole('treeitem', { name: /Navigate to Discover/i });
    await expect(discoverTab).toBeVisible({ timeout: 10_000 });
    console.log('[5] "Discover" tab visible ✅');

    // ── 6 : Verify "Following" tab is visible inside dialog ───────
    const followingTab = page.getByRole('treeitem', { name: /Navigate to Following/i });
    await expect(followingTab).toBeVisible({ timeout: 10_000 });
    console.log('[6] "Following" tab visible ✅');

    // ── 7 : Verify "Blocked" tab is visible inside dialog ─────────
    const blockedTab = page.getByRole('treeitem', { name: /Navigate to Blocked/i });
    await expect(blockedTab).toBeVisible({ timeout: 10_000 });
    console.log('[7] "Blocked" tab visible ✅');

    // ── 8 : Verify channel search field is visible inside dialog ───
    const searchBox = page.getByRole('searchbox', { name: 'Search for channels to follow' });
    await expect(searchBox).toBeVisible({ timeout: 10_000 });
    console.log('[8] Channel search field visible ✅');

    // ── 9 : Verify "Close" button is visible inside dialog ─────────
    const closeBtn = dialog.getByRole('button', { name: /^Close$/i });
    await expect(closeBtn).toBeVisible({ timeout: 10_000 });
    console.log('[9] "Close" button visible ✅');

    // ── 10 : Click the "Close" button ──────────────────────────────
    await closeBtn.click({ force: true });
    console.log('[10] Clicked "Close"');

    // ── 11 : Verify dialog is no longer visible ────────────────────
    await expect(
      page.getByRole('dialog', { name: 'Personalize My Feed' }),
    ).not.toBeVisible({ timeout: 10_000 });
    console.log('[11] Dialog no longer visible ✅');

    console.log('\n✅ ALL ASSERTIONS PASSED');

  }); // end test
}); // end describe
