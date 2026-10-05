import { test as setup, expect } from '@playwright/test';
import { LoginPage } from '../src/pages/LoginPage';
import * as path from 'path';
import * as fs from 'fs';

const authDir = path.join(__dirname, '../playwright/.auth');

// Create the auth directory if it doesn't exist
setup.beforeAll(() => {
  if (!fs.existsSync(authDir)) {
    fs.mkdirSync(authDir, { recursive: true });
  }
});

const roles = [
  { name: 'superadmin', envPrefix: 'SUPERADMIN' },
  { name: 'hr', envPrefix: 'HR' },
  { name: 'manager', envPrefix: 'MANAGER' },
  { name: 'employee', envPrefix: 'EMPLOYEE' },
  { name: 'recruiter', envPrefix: 'RECRUITER' }
];

for (const role of roles) {
  setup(`authenticate as ${role.name}`, async ({ page }) => {
    const email = process.env[`${role.envPrefix}_USERNAME`];
    const password = process.env[`${role.envPrefix}_PASSWORD`];

    // Skip if credentials are not provided in .env
    if (!email || !password) {
      console.log(`Skipping auth setup for ${role.name}: missing credentials in .env`);
      setup.skip();
      return;
    }

    const loginPage = new LoginPage(page);
    await loginPage.goto();
    
    // Login with the specific role credentials
    await loginPage.emailInput.fill(email);
    await loginPage.passwordInput.fill(password);
    await loginPage.signInButton.click();

    // Wait for the app to redirect to /home after successful login
    await page.waitForURL('**/home', { timeout: 15000 });

    // Save the authentication state (cookies and localStorage)
    await page.context().storageState({ path: path.join(authDir, `${role.name}.json`) });
  });
}
