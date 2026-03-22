const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.type(), msg.text()));
  page.on('pageerror', error => console.error('BROWSER ERROR:', error.message));
  
  console.log('Navigating to http://localhost:3000/orders ...');
  await page.goto('http://localhost:3000/orders', { waitUntil: 'networkidle' });
  
  console.log('Page title:', await page.title());
  
  const content = await page.content();
  console.log('Body length:', content.length);
  
  await browser.close();
})();
