const { chromium } = require('playwright');
const MailosaurClient = require('mailosaur');
require('dotenv').config();

(async () => {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();
    
    const email = 'candidate-csethofc@ahrf69uu.mailosaur.net';
    console.log('Fetching old email for: ' + email);
    
    const client = new MailosaurClient(process.env.MAILOSAUR_API_KEY);
    const message = await client.messages.get(
        process.env.MAILOSAUR_SERVER_ID, 
        { sentTo: email }, 
        { receivedAfter: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // last 30 days
    );
    
    const urlMatch = message.html.body.match(/(https?:\/\/[^\s\"'<>]+pre-onboard[^\s\"'<>]+)/);
    const url = urlMatch ? urlMatch[1] : message.html.body.match(/(https?:\/\/[^\s"'<>]+)/)[1];
    console.log('URL:', url);
    
    await page.goto(url, { waitUntil: 'load' });
    await page.waitForSelector('input', { timeout: 15000 });
    
    const fields = await page.evaluate(() => 
        Array.from(document.querySelectorAll('input, select, textarea')).map(el => {
            const t = el.tagName.toLowerCase();
            const type = el.type || '';
            const p = el.placeholder || '';
            const n = el.name || '';
            const label = el.closest('label')?.textContent || document.querySelector('label[for="'+el.id+'"]')?.textContent || '';
            return t + ' ' + type + ' name="' + n + '" label="' + label.trim() + '" placeholder="' + p + '"';
        })
    );
    console.log(fields.join('\n'));
    await browser.close();
})().catch(console.error);
