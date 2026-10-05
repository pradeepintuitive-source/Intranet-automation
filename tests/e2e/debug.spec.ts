import { test } from '@playwright/test';
import { HomePage } from '../../src/pages/HomePage';
import { IncentivePage } from '../../src/pages/IncentivePage';
import { PageHelper } from '../../src/utils/PageHelper';
import * as fs from 'fs';

test.use({ storageState: 'playwright/.auth/superadmin.json' });

test('debug Add Incentive', async ({ page, context }) => {
    test.setTimeout(120000);
    
    const homePage = new HomePage(page);
    await homePage.goto();
    const accountPage = await homePage.openAccountsModule(context);
    
    const incentivePage = new IncentivePage(accountPage);
    await incentivePage.navigateTo();
    
    // THE FIX: Wait for the table to actually load before proceeding!
    await accountPage.waitForSelector('table', { timeout: 30000 });
    
    await PageHelper.dismissNotificationsPanel(accountPage);
    
    // Attempt to click Add button
    const addBtn = accountPage.getByRole('button', { name: 'Add' });
    if (await addBtn.count() > 0) {
        await addBtn.first().click();
        
        // Wait for modal to render
        await accountPage.waitForSelector('div[role="dialog"]', { timeout: 15000 }).catch(() => console.log('no dialog found'));
        await PageHelper.waitForLoaderToDisappear(accountPage); // Wait for modal data to load!
        await accountPage.waitForTimeout(2000); // Give it a bit more time just to be safe
    } else {
        console.log('Add button not found');
    }
    
    await accountPage.screenshot({ path: 'debug.png', fullPage: true });
    
    const html = await accountPage.content();
    fs.writeFileSync('debug2.html', html);
    console.log('HTML and Screenshot SAVED');
    
    // Dump all labels, inputs, selects, options
    const fields = await accountPage.locator('label, input, select, [role="option"]').evaluateAll(els => 
        els.map(e => e.tagName + ': ' + (e.textContent?.trim() || e.getAttribute('placeholder') || e.getAttribute('aria-label') || e.id))
    );
    console.log("FIELDS:", fields);
});
