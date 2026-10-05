const { chromium } = require('playwright');

const roles = [
  { name: 'manager', email: 'yokesh@intuitiveapps.com', password: 'Admin@12345' },
  { name: 'employee', email: 'pradeep@intuitiveapps.com', password: 'Admin@12345' },
];

(async () => {
  const browser = await chromium.launch();
  for (const role of roles) {
    const page = await browser.newPage();
    await page.goto('https://qa.intranet.intuitiveapps.com/');
    await page.fill('#email', role.email);
    await page.fill('#password', role.password);
    await page.click('button[type="submit"]');
    try {
      await page.waitForSelector('.Toastify__toast, [role="alert"]', { timeout: 10000 });
      const toastText = await page.locator('.Toastify__toast').first().innerText().catch(() => '');
      const alertText = await page.locator('[role="alert"]').first().innerText().catch(() => '');
      console.log(`${role.name} => Toast: "${toastText}" | Alert: "${alertText}" | URL: ${page.url()}`);
    } catch (e) {
      console.log(`${role.name} => No toast/alert found. URL: ${page.url()}`);
    }
    await page.close();
  }
  await browser.close();
})();
