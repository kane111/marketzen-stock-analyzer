const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  
  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });
  
  page.on('pageerror', err => {
    errors.push(err.message);
  });

  try {
    await page.goto('https://ftzfilvoh73a.space.minimax.io', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    
    const title = await page.title();
    console.log('Page title:', title);
    
    // Check if main content loaded
    const mainContent = await page.$('.min-h-screen');
    console.log('Main content loaded:', !!mainContent);
    
    // Check for navigation buttons
    const navButtons = await page.$$('button');
    console.log('Navigation buttons found:', navButtons.length);
    
    if (errors.length > 0) {
      console.log('\nConsole errors found:');
      errors.forEach(err => console.log('  -', err));
    } else {
      console.log('\nNo console errors found!');
    }
    
  } catch (e) {
    console.error('Test failed:', e.message);
  } finally {
    await browser.close();
  }
})();
