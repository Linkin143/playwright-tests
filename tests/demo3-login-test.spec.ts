import { test, expect } from '@playwright/test';

test.describe('Positive Login Test', () => {
  test('should successfully login with valid credentials', async ({ page }) => {
    // Navigate to the login page
    await page.goto('https://practicetestautomation.com/practice-test-login/');
    console.log('✓ Navigated to login page');

    // Fill username field
    await page.fill('input[id="username"]', 'student');
    console.log('✓ Entered username: student');

    // Fill password field
    await page.fill('input[id="password"]', 'Password123');
    console.log('✓ Entered password: Password123');

    // Click Submit button
    await page.click('button[id="submit"]');
    console.log('✓ Clicked Submit button');

    // Verify URL contains "logged-in-successfully"
    await expect(page).toHaveURL(/logged-in-successfully/);
    console.log('✓ URL verification passed: Contains "logged-in-successfully"');

    // Verify page contains "Congratulations" or "successfully logged in"
    const pageContent = await page.textContent('body');
    const hasSuccessMessage = 
      pageContent?.includes('Congratulations') || 
      pageContent?.includes('successfully logged in');
    expect(hasSuccessMessage).toBeTruthy();
    console.log('✓ Success message verification passed');

    // Verify "Log out" button is visible
    await expect(page.locator('text=Log out')).toBeVisible();
    console.log('✓ Log out button is visible');

    console.log('\n=== Test Completed Successfully ===');
  });
});
