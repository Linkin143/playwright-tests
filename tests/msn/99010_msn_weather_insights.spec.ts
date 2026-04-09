import { expect, test } from '@playwright/test';

/**
 * ID   : 9905
 * Name : msn_weather_widget
 * File : 9905_msn_weather_widget.spec.ts
 * Site : https://www.msn.com/en-in
 *
 * Live DOM findings (Apr 2026):
 *  - Weather widget: a#i_weather in header area (shadow DOM, not light DOM)
 *    aria-label format: "City: Conditions, Temperature °C"
 *    e.g. "Faizabad: Mostly cloudy, 28 °C"
 *  - Widget has target="_blank" — use page.goto(href) to navigate to forecast
 *  - Weather forecast page: title = "City, State Weather Forecast | MSN Weather"
 *  - Forecast page body contains: "humidity", "wind", "forecast" text
 *  - Temperature link: role=link, name=/\d+°/ — visible on forecast page
 *  - Conditions text (cloudy/sunny/rain/etc.): visible on forecast page
 *  - Extended forecast: page heading contains city name
 *  - Widget is stable after back navigation (still count=1, label intact)
 *
 *  NOTE: Temperature values and city name are dynamic (location-detected).
 *  Assertions check STRUCTURE only, not specific values:
 *  - aria-label exists and contains "°" (temperature present)
 *  - aria-label contains ":" (city:conditions format)
 *  - Forecast page URL contains "weather"
 *  - Forecast page body contains "humidity" and "forecast"
 */

test.describe('MSN – Weather Widget: Display, Navigation, and Stability', () => {
  test.describe.configure({ timeout: 120_000 });

  test('Verify weather widget, navigate to forecast, return and check stability', async ({ page }) => {
    test.slow();

    // ── 1-2 : Navigate and stabilize ──────────────────────────────
    await page.goto('https://www.msn.com/en-in', {
      waitUntil: 'domcontentloaded',
      timeout: 30_000,
    });
    await page.waitForTimeout(5000);
    console.log('[1-2] MSN loaded and stabilised');

    // Weather widget locator — confirmed via live DOM analysis
    // Element: a#i_weather (in shadow DOM, but Playwright pierces it)
    const weatherWidget = page.locator('a#i_weatherddxxs');

    // ── 3 : Locate the weather widget on the homepage ─────────────
    await expect(weatherWidget).toBeAttached({ timeout: 10_000 });
    const wwLabel = await weatherWidget.getAttribute('aria-label');
    expect(wwLabel, '[S3] Weather widget aria-label should exist').toBeTruthy();
    console.log(`[3] Weather widget found: "${wwLabel}" ✅`);

    // ── 4 : Verify temperature is displayed ───────────────────────
    // aria-label format: "City: Conditions, Temp °C" — must contain "°"
    expect(wwLabel, '[S4] Temperature (°) should be in widget label').toContain('°');
    console.log('[4] Temperature displayed in widget ✅');

    // ── 5 : Verify city/location is detected ─────────────────────
    // aria-label format: "City: ..." — must contain ":"
    expect(wwLabel, '[S5] City:conditions format should be present').toContain(':');
    const city = wwLabel!.split(':')[0].trim();
    expect(city.length, '[S5] City name should be non-empty').toBeGreaterThan(0);
    console.log(`[5] City detected: "${city}" ✅`);

    // ── 6 : Click the weather widget (navigate to forecast page) ──
    // Widget has target="_blank"; navigate directly via href for reliability
    const wwHref = await weatherWidget.getAttribute('href ');
    expect(wwHref, '[S6] Widget should have href').toBeTruthy();
    await page.goto(wwHref!, { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await page.waitForTimeout(4000);
    console.log('[6] Navigated to weather forecast page ✅');

    // ── 7 : Verify detailed weather page loaded ───────────────────
    const forecastUrl   = page.url();
    const forecastTitle = await page.title();
    expect(forecastUrl, '[S7] URL should contain "weather"').toContain('weather');
    expect(forecastTitle.toLowerCase(), '[S7] Title should contain "weather"').toContain('weather');
    console.log(`[7] Weather page loaded: "${forecastTitle}" ✅`);

    // ── 8 : Verify extended forecast is displayed ─────────────────
    // Page heading contains detected city name
    const heading = page.getByRole('heading').first();
    await expect(heading).toBeVisible({ timeout: 10_000 });
    const headingTxt = await heading.textContent();
    expect(headingTxt, '[S8] Heading should contain city name').toContain(city);
    // Body text should contain "forecast"
    const bodyText = await page.locator('body').textContent();
    expect(bodyText?.toLowerCase(), '[S8] Page should contain "forecast"').toContain('forecast');
    console.log(`[8] Extended forecast displayed for "${headingTxt?.trim()}" ✅`);

    // ── 9 : Verify temperature, humidity, and conditions visible ──
    // Temperature — link with ° character in text or label
    const tempEl = page.getByRole('link', { name: /\d+°/ }).first();
    await expect(tempEl).toBeAttached({ timeout: 8_000 });
    console.log('[9a] Temperature element present ✅');

    // Humidity — page body text contains "humidity"
    expect(bodyText?.toLowerCase(), '[S9] Page should contain "humidity"').toContain('humidity');
    console.log('[9b] Humidity text present ✅');

    // Conditions — page body text contains weather condition words
    const hasConditions = /cloudy|sunny|rain|storm|clear|partly|mostly|fog|snow|wind/i.test(bodyText || '');
    expect(hasConditions, '[S9] Weather conditions text should be present').toBe(true);
    console.log('[9c] Weather conditions text present ✅');

    // ── 10-11 : Navigate back to homepage and verify ───────────────
    await page.goto('https://www.msn.com/en-in', {
      waitUntil: 'domcontentloaded',
      timeout: 30_000,
    });
    await page.waitForTimeout(5000);
    console.log('[10] Navigated back to homepage');

    const homeUrl   = page.url();
    const homeTitle = await page.title();
    expect(homeUrl, '[S11] Should be back on MSN homepage').toContain('msn.com/en-in');
    expect(homeTitle, '[S11] Title should contain MSN').toContain('MSN');
    console.log('[11] Homepage loaded successfully ✅');

    // ── 12 : Verify weather widget is still visible and stable ─────
    const widgetBack = page.locator('a#i_weatherdds');
    await expect(widgetBack).toBeAttached({ timeout: 10_000 });
    const wwLabelBack = await widgetBack.getAttribute('aria-label ');
    expect(wwLabelBack, '[S12] Widget should still have aria-label').toBeTruthy();
    expect(wwLabelBack, '[S12] Widget should still show temperature').toContain('°');
    console.log(`[12] Weather widget stable: "${wwLabelBack}" ✅`);

    console.log('\n✅ ALL ASSERTIONS PASSED');

  }); // end test
}); // end describe
