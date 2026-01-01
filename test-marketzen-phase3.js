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
    await page.goto('https://0kolp7a5bwm6.space.minimax.io', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    
    const title = await page.title();
    console.log('Page title:', title);
    
    // Check if main content loaded
    const mainContent = await page.$('.min-h-screen');
    console.log('Main content loaded:', !!mainContent);
    
    // Check for navigation buttons
    const navButtons = await page.$$('button');
    console.log('Navigation buttons found:', navButtons.length);
    
    // Test clicking on Theme button
    const themeButton = await page.$('button:has-text("Theme")');
    if (themeButton) {
      await themeButton.click();
      await page.waitForTimeout(1000);
      const themeContent = await page.$('text=Theme Settings');
      console.log('Theme settings loaded:', !!themeContent);
    }
    
    // Test clicking on Charts button
    const chartsButton = await page.$('button:has-text("Charts")');
    if (chartsButton) {
      await chartsButton.click();
      await page.waitForTimeout(1000);
      const chartsContent = await page.$('text=Advanced Charting');
      console.log('Advanced charting loaded:', !!chartsContent);
    }
    
    // Test clicking on Export button
    const exportButton = await page.$('button:has-text("Export")');
    if (exportButton) {
      await exportButton.click();
      await page.waitForTimeout(1000);
      const exportContent = await page.$('text=Data Export');
      console.log('Data export loaded:', !!exportContent);
    }
    
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
