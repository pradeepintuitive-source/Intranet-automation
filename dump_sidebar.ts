import { chromium } from 'playwright';
import fs from 'fs';

(async () => {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ storageState: 'playwright/.auth/hr.json' });
    const page = await context.newPage();
    
    await page.goto('https://qa.intranet.intuitiveapps.com/accounts/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Dump sidebar HTML
    const sidebar = await page.locator('aside, nav').first().innerHTML();
    fs.writeFileSync('sidebar.html', sidebar);
    console.log('Sidebar saved to sidebar.html');
    
    // Try to click Accounts to expand it, then dump again
    try {
        await page.getByRole('button', { name: 'Accounts' }).click();
        await page.waitForTimeout(1000);
        const sidebarExpanded = await page.locator('aside, nav').first().innerHTML();
        fs.writeFileSync('sidebar_expanded.html', sidebarExpanded);
        console.log('Expanded sidebar saved to sidebar_expanded.html');
    } catch (e) {
        console.error('Could not expand Accounts', e);
    }
    
    await browser.close();
})();
