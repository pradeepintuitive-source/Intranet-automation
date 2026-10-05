import { test, expect } from '@playwright/test';
import { LoginPage } from '../../src/pages/LoginPage';
import { HomePage } from '../../src/pages/HomePage';
import { JoinerPage } from '../../src/pages/JoinerPage';
import fs from 'fs';

test('dump modal html', async ({ page }) => {
  const loginPage = new LoginPage(page);
  const homePage = new HomePage(page);
  const joinerPage = new JoinerPage(page);

  await loginPage.goto();
  await loginPage.login('sonali.jain@intuitiveapps.com', 'Test@123');
  await homePage.goto();
  
  // navigate to joiners
  const nav = page.locator('nav');
  await nav.getByRole('button', { name: 'Accounts', exact: true }).click();
  await nav.getByRole('button', { name: 'Joiners', exact: true }).click();
  await page.waitForSelector('table tbody tr', { timeout: 15000 });
  
  // Click add joiner
  await page.getByRole('button', { name: 'Add', exact: true }).click();
  
  // Wait for modal
  await page.waitForSelector('h2:has-text("Add Joiner")');
  
  // Dump modal HTML
  const modalHtml = await page.locator('div[role="dialog"]').innerHTML();
  fs.writeFileSync('modal.html', modalHtml);
});
