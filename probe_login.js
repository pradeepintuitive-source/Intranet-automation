const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('https://qa.intranet.intuitiveapps.com/');
  await page.fill('#email', 'info@intuitiveapps.com');
  await page.fill('#password', 'Admin@12345');
  await page.click('button[type="submit"]');
  await page.waitForLoadState('networkidle');
  console.log('URL after login:', page.url());
  await browser.close();
})();
