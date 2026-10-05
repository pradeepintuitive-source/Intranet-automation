const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch({ headless: true });

  // ── 1. Explore Intranet: Referral Form ────────────────────────────────────
  console.log('\n======= INTRANET REFERRAL FORM =======');
  const iPage = await browser.newPage();
  await iPage.goto('https://qa.intranet.intuitiveapps.com/');
  await iPage.fill('#email', 'info@intuitiveapps.com');
  await iPage.fill('#password', 'Admin@12345');
  await iPage.click('button[type="submit"]');
  await iPage.waitForURL('**/home', { timeout: 20000 });
  console.log('Intranet logged in. URL:', iPage.url());

  // Try to navigate to HRMS → Employee Referral
  try {
    await iPage.goto('https://qa.intranet.intuitiveapps.com/hrms/employee-referral');
    await iPage.waitForLoadState('networkidle', { timeout: 10000 });
    console.log('Referral Page URL:', iPage.url());
    fs.writeFileSync('referral_page.html', await iPage.content());
    console.log('Saved referral_page.html');
  } catch(e) {
    console.log('Direct nav failed, saving home HTML instead');
    fs.writeFileSync('referral_page.html', await iPage.content());
  }

  // Try common URL patterns for Add Referral button
  const buttons = await iPage.locator('button, a').allInnerTexts();
  console.log('Buttons/Links on page:', buttons.filter(t => t.trim().length > 0).join(' | '));

  // ── 2. Explore Intranet: Journey Page ─────────────────────────────────────
  console.log('\n======= INTRANET JOURNEY PAGE =======');
  try {
    await iPage.goto('https://qa.intranet.intuitiveapps.com/hrms/journey');
    await iPage.waitForLoadState('networkidle', { timeout: 10000 });
    console.log('Journey Page URL:', iPage.url());
    fs.writeFileSync('journey_page.html', await iPage.content());
    console.log('Saved journey_page.html');
    const jButtons = await iPage.locator('button, a, th').allInnerTexts();
    console.log('Journey buttons/headers:', jButtons.filter(t => t.trim().length > 0).join(' | '));
  } catch(e) {
    console.log('Journey page error:', e.message);
  }

  await iPage.close();

  // ── 3. Explore InstaSign ──────────────────────────────────────────────────
  console.log('\n======= INSTASIGN =======');
  const sPage = await browser.newPage();
  await sPage.goto('https://www.dev.instasign.ai/login');
  await sPage.waitForLoadState('networkidle', { timeout: 15000 });
  console.log('InstaSign login URL:', sPage.url());
  // Try to find email and password fields
  const inputs = await sPage.locator('input').all();
  for (const input of inputs) {
    const type = await input.getAttribute('type').catch(() => '');
    const placeholder = await input.getAttribute('placeholder').catch(() => '');
    const id = await input.getAttribute('id').catch(() => '');
    const name = await input.getAttribute('name').catch(() => '');
    console.log(`Input: type=${type} id=${id} name=${name} placeholder=${placeholder}`);
  }
  fs.writeFileSync('instasign_login.html', await sPage.content());
  console.log('Saved instasign_login.html');

  await browser.close();
})();
