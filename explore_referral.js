const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  // Login as Super Admin
  await page.goto('https://qa.intranet.intuitiveapps.com/');
  await page.fill('#email', 'info@intuitiveapps.com');
  await page.fill('#password', 'Admin@12345');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/home', { timeout: 20000 });
  console.log('Logged in. URL:', page.url());

  // Navigate directly to the journey page so sidebar loads
  await page.goto('https://qa.intranet.intuitiveapps.com/hrms/journey');
  await page.waitForLoadState('networkidle');

  // Get all sidebar buttons
  const sidebarBtns = await page.locator('nav button, aside button').all();
  console.log('\nSidebar buttons:');
  for (const btn of sidebarBtns) {
    const txt = await btn.innerText().catch(() => '');
    const cls = await btn.getAttribute('class').catch(() => '');
    if (txt.trim()) console.log(`  BUTTON: "${txt.trim()}" | class snippet: ${cls?.slice(0,80)}`);
  }

  // Click Employee Referral in sidebar
  const referralBtn = page.locator('nav button:has-text("Employee Referral"), aside button:has-text("Employee Referral")').first();
  if (await referralBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    console.log('\nClicking Employee Referral sidebar button...');
    await referralBtn.click();
    await page.waitForLoadState('networkidle');
    console.log('URL after click:', page.url());
  } else {
    console.log('Employee Referral button not found in sidebar');
    // Try to find text on page
    const allText = await page.locator('button').allInnerTexts();
    console.log('All buttons:', allText.filter(t => t.trim()).join(' | '));
  }

  // After clicking, look for Add Referral button
  await page.waitForTimeout(2000);
  const pageButtons = await page.locator('button').allInnerTexts();
  console.log('Page buttons after nav:', pageButtons.filter(t => t.trim()).join(' | '));
  console.log('Current URL:', page.url());

  // Try clicking Add / Submit Referral button
  const addReferralBtn = page.locator('button').filter({ hasText: /add|submit|referral/i }).first();
  if (await addReferralBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    const btnText = await addReferralBtn.innerText();
    console.log(`\nFound add button: "${btnText}" - clicking...`);
    await addReferralBtn.click();
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
    fs.writeFileSync('referral_form_final.html', await page.content());
    console.log('\nSaved referral_form_final.html');
  } else {
    console.log('Add referral button not visible');
  }

  await browser.close();
})();
