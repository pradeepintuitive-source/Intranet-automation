const fs = require('fs');
const html = fs.readFileSync('C:\\Users\\USER\\.gemini\\antigravity-ide\\scratch\\intranet-qa-automation\\scratch\\form.html', 'utf8');
let idx = html.indexOf('id="client"');
console.log(html.substring(Math.max(0, idx - 100), idx + 2000).match(/<input[^>]*>/g));
