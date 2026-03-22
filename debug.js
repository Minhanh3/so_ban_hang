import fs from 'fs';
import puppeteer from 'puppeteer';

(async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    const logs = [];
    page.on('console', msg => logs.push(`[CONSOLE] ${msg.type()}: ${msg.text()}`));
    page.on('pageerror', err => logs.push(`[PAGE_ERROR] ${err.toString()}`));
    page.on('response', resp => logs.push(`[RESPONSE] ${resp.status()} ${resp.url()}`));
    page.on('requestfailed', req => logs.push(`[REQ_FAILED] ${req.url()}: ${req.failure()?.errorText}`));
    
    console.log("Navigating...");
    try {
        await page.goto('http://localhost:3000/#/orders', { waitUntil: 'networkidle0', timeout: 10000 });
    } catch(e) {
        logs.push(`[GOTO_ERROR] ${e.message}`);
    }
    
    console.log("Writing logs...");
    fs.writeFileSync('error_dump.txt', logs.join('\n'));
    await browser.close();
})();
