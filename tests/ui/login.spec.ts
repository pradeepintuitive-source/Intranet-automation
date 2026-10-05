import { test, expect } from '@playwright/test';
import { LoginPage } from '../../src/pages/LoginPage';

test.describe('Authentication', { tag: ['@smoke', '@regression'] }, () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.goto();
  });

  test('should display login elements correctly', async ({ page }) => {
    await expect(loginPage.emailInput).toBeVisible();
    await expect(loginPage.passwordInput).toBeVisible();
    await expect(loginPage.signInButton).toBeVisible();
  });

  test('TC_LOG_001: should login with valid email and password', async ({ page }) => {
    // Uses environment variables TEST_USER_USERNAME and TEST_USER_PASSWORD
    await loginPage.login();
    // Wait for redirection to role-specific dashboard or home page
    // await page.waitForURL(/.*dashboard.*/);
  });


  test('TC_LOG_003: should show mandatory fields validation ("Email is Required")', async ({ page }) => {
    // Leave email blank, enter password, and submit
    await loginPage.login('', 'Password123!');
    await expect(loginPage.emailRequiredError).toBeVisible();
  });

  test('TC_LOG_004: should handle invalid credentials', async ({ page }) => {
    // Enter invalid email and incorrect password
    await loginPage.login('invalid-user@example.com', 'wrongpassword123');
    await expect(loginPage.invalidCredentialsError).toBeVisible();
  });
});
