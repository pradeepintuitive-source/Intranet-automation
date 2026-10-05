import { test, expect } from '@playwright/test';
import * as path from 'path';

/**
 * TC_LOG_001 (Role-Based) - Verify that each role can log in properly
 * Each test injects the pre-saved auth state for the role and verifies
 * that the app has landed on the /home page successfully.
 */

const roles = [
  { name: 'Super Admin', storageState: 'superadmin' },
  { name: 'HR', storageState: 'hr' },
  { name: 'Manager', storageState: 'manager' },
  { name: 'Employee', storageState: 'employee' },
  { name: 'Recruiter', storageState: 'recruiter' },
];

for (const role of roles) {
  const authFile = path.join(__dirname, `../../playwright/.auth/${role.storageState}.json`);

  // Role login is critical path, so it belongs to @smoke, @sanity, and @regression
  test.describe(`[${role.name}] Role Login Verification @login @${role.storageState} @smoke @sanity @regression`, () => {
    // Inject the saved auth state - no UI login needed!
    test.use({ storageState: authFile });

    test(`TC_LOG_001 - ${role.name} should be logged in and land on /home`, async ({ page }) => {
      // Navigate to home directly - the session is already injected
      await page.goto('/home');

      // Assert that the URL is /home (not redirected back to login page)
      await expect(page).toHaveURL(/.*\/home/);

      // Assert that the login page is NOT visible (i.e., we are not logged out)
      await expect(page.locator('#email')).not.toBeVisible();
    });
  });
}
