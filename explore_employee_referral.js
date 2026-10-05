const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  // Login as Employee
  await page.goto('https://qa.intranet.intuitiveapps.com/');
  await page.fill('#email', 'pradeep@intuitiveapps.com');
  await page.fill('#password', 'Admin@123');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/home', { timeout: 20000 });
  console.log('Logged in as Employee. URL:', page.url());

  // Click Portfolio -> My Referrals
  const portfolioBtn = page.locator('nav button, aside button').filter({ hasText: /Portfolio/i }).first();
  if (await portfolioBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
    console.log('Clicking Portfolio...');
    await portfolioBtn.click();
    await page.waitForTimeout(1000);
    
    const myReferralsBtn = page.locator('button, a').filter({ hasText: /My Referrals/i }).first();
    if (await myReferralsBtn.isVisible()) {
      console.log('Clicking My Referrals...');
      await myReferralsBtn.click();
      await page.waitForLoadState('networkidle');
      console.log('URL after click:', page.url());
    } else {
      console.log('My Referrals button not found');
    }
  } else {
    console.log('Portfolio button not found in sidebar');
    const allBtns = await page.locator('nav button, aside button').allInnerTexts();
    console.log('Sidebar buttons:', allBtns.join(' | '));
  }

  // Look for Add / Submit Referral button
  await page.waitForTimeout(2000);
  const addBtn = page.locator('button').filter({ hasText: /add|submit/i }).first();
  if (await addBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    console.log(`Found add button: "${await addBtn.innerText()}" - clicking...`);
    await addBtn.click();
    await page.waitForTimeout(2000);

    // Get form fields
    const labels = await page.locator('label').allInnerTexts();
    console.log('\nForm labels:', labels.filter(t => t.trim()).join(' | '));
    
    const inputs = await page.locator('input, select, textarea').all();
    console.log('Form inputs:');
    for (const inp of inputs) {
      const tag = await inp.evaluate(el => el.tagName);
      const id = await inp.getAttribute('id').catch(() => '');
      const name = await inp.getAttribute('name').catch(() => '');
      const placeholder = await inp.getAttribute('placeholder').catch(() => '');
      const type = await inp.getAttribute('type').catch(() => '');
      console.log(`  ${tag}: id="${id}" name="${name}" type="${type}" placeholder="${placeholder}"`);
    }
    fs.writeFileSync('employee_referral_form.html', await page.content());
    console.log('\nSaved employee_referral_form.html');
  } else {
    console.log('Add referral button not visible on Employee page either');
  }

  await browser.close();
})();
