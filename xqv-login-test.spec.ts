import { test, expect } from '@playwright/test';

test.describe('Positive Login Test', () => {
  test('should successfully log in with valid credentials', async ({ page }) => {
    // Navigate to the login page
    await page.goto('https://practicetestautomation.com/practice-test-login/');

    // Fill in the username field
    await page.fill('input[id="username"]', 'student');

    // Fill in the password field
    await page.fill('input[id="password"]', 'Password123');

    // Click the Submit button
    await page.click('button[id="submit"]');

    // Verify URL contains "logged-in-successfully"
    await expect(page).toHaveURL(/logged-in-successfully/);

    // Verify page contains "Congratulations" or "successfully logged in"
    const pageContent = await page.textContent('body');
    const hasSuccessMessage = 
      pageContent?.includes('Congratulations') || 
      pageContent?.includes('successfully logged in');
    expect(hasSuccessMessage).toBeTruthy();

    // Verify "Log out" button is visible
    await expect(page.locator('text=Log out')).toBeVisible();
  });
});
