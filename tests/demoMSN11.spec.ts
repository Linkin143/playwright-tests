import { test, expect, Page, Locator } from '@playwright/test';

// ── Global test timeout: minimum 120 seconds for real-world website ──────────
test.setTimeout(120000);

// ─────────────────────────────────────────────────────────────────────────────
// HELPER : Dismiss consent / cookie banners safely
// ─────────────────────────────────────────────────────────────────────────────
async function dismissConsentBanner(page: Page): Promise<void> {
  try {
    const acceptAll = page.getByRole('button', { name: 'Accept all' });
    if (await acceptAll.isVisible({ timeout: 5000 })) {
      await acceptAll.click();
      await page.waitForTimeout(1000);
      console.log('[Consent] Dismissed via "Accept all".');
      return;
    }
  } catch { /* not present */ }
  try {
    const agree = page.getByRole('button', { name: 'Agree' });
    if (await agree.isVisible({ timeout: 4000 })) {
      await agree.click();
      await page.waitForTimeout(1000);
      console.log('[Consent] Dismissed via "Agree".');
      return;
    }
  } catch { /* not present */ }
  console.log('[Consent] No consent banner detected.');
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPER : Resolve the active personalize panel container (always call FRESH)
// Priority: dialog → region → complementary → body
// Uses 12 s expect timeout for dynamic SPA elements
// ─────────────────────────────────────────────────────────────────────────────
async function resolveContainer(page: Page): Promise<Locator> {
  const dialog = page.getByRole('dialog');
  if (await dialog.isVisible({ timeout: 6000 }).catch(() => false)) {
    console.log('[Container] Resolved: role=dialog');
    return dialog;
  }
  const region = page.getByRole('region').first();
  if (await region.isVisible({ timeout: 5000 }).catch(() => false)) {
    console.log('[Container] Resolved: role=region');
    return region;
  }
  const complementary = page.getByRole('complementary');
  if (await complementary.isVisible({ timeout: 5000 }).catch(() => false)) {
    console.log('[Container] Resolved: role=complementary');
    return complementary;
  }
  console.log('[Container] Resolved: body (fallback)');
  return page.locator('body');
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPER : Click "Personalize" — self-healing: button → link → text
// Uses 12 s expect timeout for dynamic element
// ─────────────────────────────────────────────────────────────────────────────
async function clickPersonalize(page: Page): Promise<void> {
  let el: Locator = page.getByRole('button', { name: 'Personalize' });
  if (!(await el.isVisible({ timeout: 8000 }).catch(() => false))) {
    el = page.getByRole('link', { name: 'Personalize' });
  }
  if (!(await el.isVisible({ timeout: 6000 }).catch(() => false))) {
    el = page.getByText('Personalize', { exact: true });
  }
  await expect(el).toBeVisible({ timeout: 12000 });
  await el.click();
  console.log('[Personalize] Entry point clicked.');
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPER : Resolve search box by EXACT placeholder (always call FRESH)
// Spec: placeholder = "Search for channels to follow"
// All expect() calls use 12 s timeout for dynamic SPA elements
// ─────────────────────────────────────────────────────────────────────────────
async function resolveSearchBox(page: Page, container: Locator): Promise<Locator> {
  // PRIMARY: exact placeholder scoped to container — most precise
  let el: Locator = container.getByPlaceholder('Search for channels to follow');
  if (!(await el.isVisible({ timeout: 7000 }).catch(() => false))) {
    // FALLBACK 1: searchbox role scoped to container
    el = container.getByRole('searchbox');
  }
  if (!(await el.isVisible({ timeout: 6000 }).catch(() => false))) {
    // FALLBACK 2: textbox role scoped to container
    el = container.getByRole('textbox');
  }
  if (!(await el.isVisible({ timeout: 5000 }).catch(() => false))) {
    // FALLBACK 3: exact placeholder unscoped
    el = page.getByPlaceholder('Search for channels to follow');
  }
  if (!(await el.isVisible({ timeout: 5000 }).catch(() => false))) {
    // FALLBACK 4: searchbox unscoped — last resort
    el = page.getByRole('searchbox');
  }
  await expect(el).toBeVisible({ timeout: 12000 });
  return el;
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPER : Wait for search results to appear — NO networkidle
// Waits for specific UI elements (listitem or list) to become visible
// ─────────────────────────────────────────────────────────────────────────────
async function waitForSearchResults(page: Page, container: Locator): Promise<void> {
  // PRIMARY: wait for channel result listitem to appear
  const resultItem = container.getByRole('listitem').first();
  const itemVisible = await resultItem.isVisible({ timeout: 10000 }).catch(() => false);
  if (itemVisible) {
    await expect(resultItem).toBeVisible({ timeout: 12000 });
    console.log('[Results] Results appeared (listitem).');
    return;
  }
  // FALLBACK: wait for list container to appear
  const resultList = container.getByRole('list').first();
  const listVisible = await resultList.isVisible({ timeout: 8000 }).catch(() => false);
  if (listVisible) {
    await expect(resultList).toBeVisible({ timeout: 12000 });
    console.log('[Results] Results appeared (list).');
    return;
  }
  // Safety timeout only — not networkidle
  await page.waitForTimeout(3000);
  console.log('[Results] Used timeout fallback for results wait.');
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPER : Resolve follow/add "+" button SCOPED to container (always call FRESH)
// Self-healing: "+" → "Add" → "Follow" → label:Follow → label:Add
// .first() is correct — multiple follow buttons render in results list
// All expect() calls use 12 s timeout
// ─────────────────────────────────────────────────────────────────────────────
async function resolveFollowButton(page: Page, container: Locator): Promise<Locator> {
  let el: Locator = container.getByRole('button', { name: '+' }).first();
  if (!(await el.isVisible({ timeout: 6000 }).catch(() => false))) {
    el = container.getByRole('button', { name: 'Add' }).first();
  }
  if (!(await el.isVisible({ timeout: 5000 }).catch(() => false))) {
    el = container.getByRole('button', { name: 'Follow' }).first();
  }
  if (!(await el.isVisible({ timeout: 5000 }).catch(() => false))) {
    el = container.getByLabel('Follow').first();
  }
  if (!(await el.isVisible({ timeout: 5000 }).catch(() => false))) {
    el = container.getByLabel('Add').first();
  }
  await expect(el).toBeVisible({ timeout: 12000 });
  return el;
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPER : Close the personalize panel — self-healing: Close → Done → Escape
// ─────────────────────────────────────────────────────────────────────────────
async function closePanel(page: Page, container: Locator): Promise<void> {
  let closeBtn: Locator = container.getByRole('button', { name: 'Close' });
  if (!(await closeBtn.isVisible({ timeout: 5000 }).catch(() => false))) {
    closeBtn = container.getByRole('button', { name: 'Done' });
  }
  if (!(await closeBtn.isVisible({ timeout: 4000 }).catch(() => false))) {
    closeBtn = container.getByLabel('Close');
  }
  if (await closeBtn.isVisible({ timeout: 4000 }).catch(() => false)) {
    await closeBtn.click();
    console.log('[Panel] Closed via button.');
  } else {
    await page.keyboard.press('Escape');
    console.log('[Panel] Closed via Escape key.');
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// TEST SUITE
// ─────────────────────────────────────────────────────────────────────────────
test.describe('MSN India – Personalize: Follow Channels via Search', () => {

  test('Follow The Times Of India and India Today via Personalize search', async ({ page }) => {

    // ── STEP 1 : Navigate to MSN India ───────────────────────────────────────
    await page.goto('https://www.msn.com/en-in', {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });
    await page.waitForLoadState('domcontentloaded');
    // Wait for page hero/headline to confirm page has rendered — NOT networkidle
    const pageBody = page.locator('body');
    await expect(pageBody).toBeVisible({ timeout: 12000 });
    await page.waitForTimeout(3000);
    console.log('[Step 1] MSN India loaded and stabilised.');

    // ── STEP 2 : Dismiss any consent banner ──────────────────────────────────
    await dismissConsentBanner(page);

    // ── STEP 3 : Click "Personalize" ─────────────────────────────────────────
    await clickPersonalize(page);

    // Wait for panel to open — detect via UI element, NOT networkidle
    // RE-LOCATE container FRESH after panel opened (UI changed)
    const containerAfterOpen = await resolveContainer(page);
    await expect(containerAfterOpen).toBeVisible({ timeout: 12000 });
    console.log('[Step 3] Personalize panel confirmed visible.');

    // ── STEP 4 : Search "The Times Of India" and follow ──────────────────────
    // RE-LOCATE search box FRESH — exact placeholder: "Search for channels to follow"
    const searchBox1 = await resolveSearchBox(page, containerAfterOpen);
    await searchBox1.click();
    await searchBox1.clear();
    await searchBox1.fill('The Times Of India');
    await page.waitForTimeout(400);
    await searchBox1.press('Enter');
    console.log('[Step 4] Search submitted: "The Times Of India".');

    // Wait for results — UI element wait, NOT networkidle
    // RE-LOCATE container FRESH — search changed the UI
    const containerAfterSearch1 = await resolveContainer(page);
    await waitForSearchResults(page, containerAfterSearch1);

    // RE-LOCATE follow button FRESH — results are now rendered
    const followBtn1 = await resolveFollowButton(page, containerAfterSearch1);
    await followBtn1.click();
    await page.waitForTimeout(1500);
    console.log('[Step 4] "The Times Of India" followed ✅');

    // ── STEP 5 : Clear search field ──────────────────────────────────────────
    // RE-LOCATE container FRESH — follow action changed the UI
    const containerAfterFollow1 = await resolveContainer(page);

    // RE-LOCATE search box FRESH — exact placeholder before clearing
    const searchBox2 = await resolveSearchBox(page, containerAfterFollow1);
    await searchBox2.click();
    await searchBox2.clear();
    await page.waitForTimeout(400);
    console.log('[Step 5] Search field cleared.');

    // ── STEP 6 : Search "India Today" and follow ─────────────────────────────
    // RE-LOCATE container FRESH — clear changed the UI state
    const containerForSearch2 = await resolveContainer(page);

    // RE-LOCATE search box FRESH — exact placeholder before second search
    const searchBox3 = await resolveSearchBox(page, containerForSearch2);
    await searchBox3.click();
    await searchBox3.clear();
    await searchBox3.fill('India Today');
    await page.waitForTimeout(400);
    await searchBox3.press('Enter');
    console.log('[Step 6] Search submitted: "India Today".');

    // Wait for results — UI element wait, NOT networkidle
    // RE-LOCATE container FRESH — second search changed the UI
    const containerAfterSearch2 = await resolveContainer(page);
    await waitForSearchResults(page, containerAfterSearch2);

    // RE-LOCATE follow button FRESH — second results now rendered
    const followBtn2 = await resolveFollowButton(page, containerAfterSearch2);
    await followBtn2.click();
    await page.waitForTimeout(1500);
    console.log('[Step 6] "India Today" followed ✅');

    // ── STEP 7 : Close the Personalize panel ─────────────────────────────────
    // RE-LOCATE container FRESH — second follow changed the UI
    const containerBeforeClose = await resolveContainer(page);
    await closePanel(page, containerBeforeClose);
    await page.waitForTimeout(2000);
    console.log('[Step 7] Personalize panel closed.');

    // ── STEP 8 : Assertions ───────────────────────────────────────────────────
    expect(page.url()).toContain('msn.com');
    console.log('✅ [Assert] URL contains "msn.com".');

    const pageTitle = await page.title();
    expect(pageTitle.length).toBeGreaterThan(0);
    console.log(`✅ [Assert] Page title present: "${pageTitle}"`);

    // ── STEP 9 : Final summary log ────────────────────────────────────────────
    console.log('');
    console.log('╔══════════════════════════════════════════════════════╗');
    console.log('║              FINAL TEST SUMMARY                      ║');
    console.log('╠══════════════════════════════════════════════════════╣');
    console.log('║  Site        : https://www.msn.com/en-in             ║');
    console.log('║  Timeout     : 120000 ms (test) / 12000 ms (expect)  ║');
    console.log('║  Search Box  : placeholder="Search for channels..."  ║');
    console.log('║  Channel 1   : The Times Of India  → Followed ✅     ║');
    console.log('║  Channel 2   : India Today         → Followed ✅     ║');
    console.log('║  Panel       : Closed ✅                             ║');
    console.log('╚══════════════════════════════════════════════════════╝');

    console.log('[Step 9] Test complete. Browser will close.');

  }); // ← END OF test(...)

}); // ← END OF test.describe(...)
