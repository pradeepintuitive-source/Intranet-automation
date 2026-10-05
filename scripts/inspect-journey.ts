import { chromium } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';
import { PageHelper } from '../src/utils/PageHelper';

(async () => {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
        storageState: 'playwright/.auth/hr.json',
        baseURL: 'https://qa.intranet.intuitiveapps.com'
    });
    
    const page = await context.newPage();
    await page.goto('/hrms/journey', { waitUntil: 'networkidle' });

    console.log('Navigated to Journey Page.');

    // Dismiss notifications panel using helper

    console.log('Dismissed notifications panel.');

    // Wait for table to load
    await page.waitForSelector('table tbody tr');

    // Get table headers
    const headers = await page.locator('table thead tr th').allTextContents();
    console.log('Headers:', headers);

    // Get the first few rows
    const rows = page.locator('table tbody tr');
    const count = await rows.count();
    console.log(`Found ${count} rows.`);

    if (count > 0) {
        // Find a row with 'Email Sent' status
        const submittedRow = rows.filter({ hasText: 'Email Sent' }).first();
        const rowText = await submittedRow.textContent();
        console.log('Selected row text:', rowText);

        // Click the row checkbox to see what buttons appear
        await submittedRow.locator('input[type="checkbox"]').check();
        console.log('Checked row.');
        await page.waitForTimeout(1000); // Wait for buttons to appear

        // Look for buttons that appear
        const buttons = await page.locator('button').all();
        console.log('Available buttons on page after selecting row:');
        for (const btn of buttons) {
            const text = await btn.textContent();
            const isVisible = await btn.isVisible();
            if (isVisible && text && text.trim().length > 0) {
                console.log(`- ${text.trim()}`);
            }
        }
        
        // Take screenshot
        await page.screenshot({ path: 'journey-selected.png', fullPage: true });
        console.log('Screenshot saved to journey-selected.png');
    }

    await browser.close();
})();
