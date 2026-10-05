const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('https://qa.intranet.intuitiveapps.com/');
  await page.fill('#email', 'pradeep@intuitiveapps.com');
  await page.fill('#password', 'wrongpassword123');
  await page.click('button:has-text("Sign In")');
  await page.waitForSelector('.Toastify__toast', { timeout: 10000 });
  const text = await page.locator('.Toastify__toast').innerText();
  console.log('TOAST:', text);
  await browser.close();
})();
